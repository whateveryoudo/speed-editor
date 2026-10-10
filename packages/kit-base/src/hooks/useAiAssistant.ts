/**
 * AI 助手 Hook - 专门为富文本编辑器 AI 功能设计
 * 基于 @microsoft/fetch-event-source 实现流式处理
 */
import { ref, inject, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useSpeedEditor } from '@speed-editor/composables';
export type AIAction = 'refactor' | 'check' | 'simple' | 'rich' | 'translate' | 'summary' | 'custom'

// AI 处理状态 idle 空闲 pending 处理中  success 成功 error 失败 cancelled 取消
export type AIStatus = 'idle' | 'pending' | 'success' | 'error' | 'cancelled'

export interface AIProcessOptions {
  action: AIAction
  content: string // 要处理的文本（这里指编辑器选择的文本）
  customPrompt?: string // 用户输入的提示词（非指令操作下，用户可以自己额外输入命令）
}

interface AISessionInfo {
  controller: AbortController | null
  status: AIStatus
  result: string
  error: string | null
}

// 自定义错误类型
class RetriableError extends Error { }
class FatalError extends Error { }

const EventStreamContentType = 'text/event-stream'

export const useAiAssistant = () => {
  // 顶层组件注入对象
  const { speedTiptapConfig } = useSpeedEditor();
  console.log(speedTiptapConfig.value);
  if (!speedTiptapConfig.value.ai || !speedTiptapConfig.value.ai.doubao) {
    message.warning('请先配置大模型请求接口');
  }
  const aiConfig = speedTiptapConfig.value?.ai;

  // 当前会话状态
  const session = ref<AISessionInfo>({
    controller: null,
    status: 'idle',
    result: '',
    error: null
  })

  const pendingText = ref('')

  /**
   * 取消当前 AI 处理
   */
  const cancelProcess = () => {
    if (session.value.controller) {
      session.value.controller.abort()
      session.value.controller = null
      session.value.status = 'cancelled'
      message.info('已取消 AI 处理')
    }
  }

  /**
   * 重置会话状态
   */
  const resetSession = () => {
    session.value.controller = null
    session.value.status = 'idle'
    session.value.result = ''
    session.value.error = null
  }

  /**
   * 流式处理文本 - 逐字输出（不自动替换，结果实时更新到 result）
   * @param options AI 处理选项
   * @returns Promise<boolean> 是否成功启动
   */
  const processTextStream = async (
    options: AIProcessOptions
  ): Promise<boolean> => {
    if (!aiConfig || !aiConfig.doubao) {
      message.warning('请先配置大模型请求接口');
      return false
    }
    if (session.value.status === 'pending') {
      message.warning('AI 正在处理中，请稍候...')
      return false
    }

    resetSession()
    const controller = new AbortController()
    session.value.controller = controller
    session.value.status = 'pending'

    const actionLabels: Record<AIAction, string> = {
      refactor: '改进写作',
      check: '检查拼写和语法',
      simple: '简化内容',
      rich: '丰富内容',
      translate: '翻译',
      summary: '总结',
      custom: '处理'
    }
    pendingText.value = `正在${actionLabels[options.action]}`;

    // TODO:兼容多种大模型
    try {
      await fetchEventSource(aiConfig?.doubao?.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig?.doubao?.header ?? {})
        },
        body: aiConfig?.bodyParams ? JSON.stringify(aiConfig.bodyParams(options.action, options.content, options.customPrompt)) : JSON.stringify({
          action: options.action,
          content: options.content,
          customPrompt: options.customPrompt
        }),
        signal: controller.signal,

        async onopen(response: any) {
          // fastapi一直是空？？
          // && response.headers.get('content-type') === EventStreamContentType
          if (response.ok) {
            // 连接成功，开始流式传输
            session.value.status = 'pending'
            return
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // 客户端错误，不可重试
            throw new FatalError(`HTTP ${response.status}`)
          } else {
            // 其他错误，可重试
            throw new RetriableError(`HTTP ${response.status}`)
          }
        },

        async onmessage(msg: any) {
          // 错误事件
          if (msg.event === 'FatalError') {
            throw new FatalError(msg.data)
          }

          // 正常数据事件
          if (msg.event === '') {
            // ✅ 处理 [DONE] 标记（豆包/火山引擎特有）
            if (msg.data === '[DONE]') { // 这里已经完成了
              return
            }

            try {
              if (msg.data === '') {
                return
              }
              const data = JSON.parse(msg.data)

              // 处理不同的数据格式
              if (data.error) {
                throw new Error(data.error)
              }
              // 提取内容（兼容不同的响应格式）
              let content = ''

              // OpenAI 格式
              if (data.choices && data.choices[0]?.delta?.content) {
                content = data.choices[0].delta.content
              }
              // 简单格式
              else if (data.content) {
                content = data.content
              }
              // 其他格式
              else if (typeof data === 'string') {
                content = data
              }

              if (content) {
                session.value.result += content
              }

              // 检查是否完成
              if (data.choices && data.choices[0]?.finish_reason === 'stop') {
                session.value.status = 'success'
                message.success('处理完成')
              }
            } catch (error: any) {
              console.error('解析消息错误:', error, '原始数据:', msg.data)
              throw new FatalError(error.message)
            }
          }
        },

        onclose() {
          // 流正常关闭
          if (session.value.status === 'pending') {
            session.value.status = 'success'
            if (session.value.result) {
              message.success('处理完成')
            }
          }
        },

        onerror(error: any) {
          console.log(error);
          // 如果是用户主动取消，不显示错误
          if (error.name === 'AbortError') {
            session.value.status = 'cancelled'
            return
          }

          session.value.status = 'error'
          session.value.error = error.message || 'AI 处理失败'
          message.error(error.message || 'AI 处理失败，请重试')
          throw error // 让 fetchEventSource 决定是否重试
        }
      })

      return true
    } catch (error: any) {
      // 用户主动取消不显示错误
      if (error.name === 'AbortError') {
        session.value.status = 'cancelled'
      } else {
        session.value.status = 'error'
        session.value.error = error.message || 'AI 处理失败'
        console.error('AI 流式处理启动失败:', error)
        message.error(error.message || 'AI 处理失败')
      }

      return false
    }
  }

  return {
    session,
    // AI 处理方法
    processTextStream,  // 流式处理
    cancelProcess,      // 取消处理
    pendingText,
    resetSession
  }
}

