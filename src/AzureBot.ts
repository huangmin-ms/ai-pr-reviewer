import './fetch-polyfill'

import {info, setFailed, warning} from '@actions/core'
import pRetry from 'p-retry'
import {OpenAIOptions, Options} from './options'
import { AzureKeyCredential, ChatCompletions, GetChatCompletionsOptions, GetCompletionsOptions, OpenAIClient } from '@azure/openai';

// define type to save parentMessageId and conversationId
export interface Ids {
  parentMessageId?: string
  conversationId?: string
}

export class AzureBot {
  private readonly api: OpenAIClient | null = null // not free

  private readonly options: Options

  private readonly openaiOptions: OpenAIOptions

  private readonly systemMessage: string

  constructor(options: Options, openaiOptions: OpenAIOptions) {
    this.options = options
    this.openaiOptions = openaiOptions
    const currentDate = new Date().toISOString().split('T')[0]
    this.systemMessage = `${options.systemMessage} 
    Knowledge cutoff: ${openaiOptions.tokenLimits.knowledgeCutOff}
    Current date: ${currentDate}
    
    IMPORTANT: Entire response must be in the language with ISO code: ${options.language}
        `
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_BASE_URL) {
        this.api = new OpenAIClient(process.env.OPENAI_API_BASE_URL, new AzureKeyCredential(process.env.OPENAI_API_KEY));
    } else {
        const err =
            "Unable to initialize the OpenAI API, both 'OPENAI_API_KEY' environment variable are not available"
        throw new Error(err)
    }
  }

  chat = async (message: string, ids: Ids): Promise<[string, Ids]> => {
    let res: [string, Ids] = ['', {}]
    try {
      res = await this.chat_(message, ids)
      return res
    } catch (e: unknown) {
      warning(`Failed to chat: ${e}`)
      return res
    }
  }

  private readonly chat_ = async (
    message: string,
    ids: Ids
  ): Promise<[string, Ids]> => {
    // record timing
    const start = Date.now()
    if (!message) {
      return ['', {}]
    }

    let response: ChatCompletions | undefined

    if (this.api != null) {
      const opts: GetChatCompletionsOptions = {
        model: this.openaiOptions.model,
        maxTokens: this.openaiOptions.tokenLimits.maxTokens,
        temperature: this.options.openaiModelTemperature
      }
    //   if (ids.parentMessageId) {
    //     opts.parentMessageId = ids.parentMessageId
    //   }
     const messages = [
        { role: "system", content: this.systemMessage },
        { role: "user", content: message }
     ];

     console.log(`open ai model: ${this.openaiOptions.model}`)
     console.log(`prompt message: ${JSON.stringify(messages)}`)

      try {
        response = await pRetry(() => this.api!.getChatCompletions(this.openaiOptions.model, messages, opts), {
          retries: this.options.openaiRetries
        })
      } catch (e: unknown) {
          info(
            `response: ${response}, failed to send message to openai: ${e}`
          )
      }
      const end = Date.now()
      info(`response: ${JSON.stringify(response)}`)
      info(
        `openai sendMessage (including retries) response time: ${
          end - start
        } ms`
      )
    } else {
      setFailed('The OpenAI API is not initialized')
    }
    let responseText = ''
    if (response != null) {
      responseText = response.choices[0].message?.content ?? '';
    } else {
      warning('openai response is null')
    }
    // remove the prefix "with " in the response
    if (responseText.startsWith('with ')) {
      responseText = responseText.substring(5)
    }
    if (this.options.debug) {
      info(`openai responses: ${responseText}`)
    }
    const newIds: Ids = {
    //   parentMessageId: response?.id,
    //   conversationId: response?.conversationId
    }
    return [responseText, newIds]
  }
}