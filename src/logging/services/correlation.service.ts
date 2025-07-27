import { Injectable } from "@nestjs/common"
import { AsyncLocalStorage } from "async_hooks"
import { v4 as uuidv4 } from "uuid"

export interface CorrelationContext {
  id: string
  userId?: string
  requestId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

@Injectable()
export class CorrelationService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>()

  run<T>(context: CorrelationContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback)
  }

  getId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.id
  }

  getContext(): CorrelationContext | undefined {
    return this.asyncLocalStorage.getStore()
  }

  setUserId(userId: string): void {
    const store = this.asyncLocalStorage.getStore()
    if (store) {
      store.userId = userId
    }
  }

  setMetadata(key: string, value: any): void {
    const store = this.asyncLocalStorage.getStore()
    if (store) {
      store.metadata = store.metadata || {}
      store.metadata[key] = value
    }
  }

  generateId(): string {
    return uuidv4()
  }
}
