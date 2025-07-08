import api from './api'

export interface UnreadCountResponse {
  unread_count: number
  user_id: number
}

export interface MarkAsReadResponse {
  status: string
  messages_marked?: number
}

class MessagingService {
  /**
   * Get unread message count for current user
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    // Add cache-busting timestamp to prevent stale data
    const timestamp = Date.now()
    const response = await api.get(`/messages/conversations/unread_count/?_t=${timestamp}`)
    return response.data
  }

  /**
   * Mark all messages as read for current user
   */
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    const response = await api.post('/messages/conversations/mark_all_as_read/')
    return response.data
  }

  /**
   * Mark a specific conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<MarkAsReadResponse> {
    const response = await api.post(`/messages/conversations/${conversationId}/mark_as_read/`)
    return response.data
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(messageId: string): Promise<MarkAsReadResponse> {
    const response = await api.post(`/messages/messages/${messageId}/mark_as_read/`)
    return response.data
  }
}

export default new MessagingService()