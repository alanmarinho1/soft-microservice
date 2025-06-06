export interface OrderCreatedMessage {
    orderId: string
    amount: number
    customerId: {
        id: string
    }
}