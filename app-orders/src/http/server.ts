import '@opentelemetry/auto-instrumentations-node/register'
import { setTimeout } from 'node:timers/promises'
import { fastify } from 'fastify'
import { randomUUID } from 'node:crypto'
import { fastifyCors } from '@fastify/cors'
import { trace } from '@opentelemetry/api'
import { custom, z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { channels } from '../broker/channels/index.ts'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()


app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*'})



app.get('/health', () => {
  console.log('Health check'); // Agora este será executado
  return 'OkkkkK';
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.coerce.number(),
    })
  }
}, async (request, reply) => {
  const { amount } = request.body

  console.log('Received order with amount:', amount)
  //channels.orders.sendToQueue('orders', Buffer.from('Hello World!'))

  const orderId = randomUUID()


  await db.insert(schema.orders).values({
    id: randomUUID(),
    customerId: 'asdasdasdads',
    amount,
  })

  //await setTimeout(2000)
  //trace.getActiveSpan()?.setAttribute('order_id', orderId)

  dispatchOrderCreated({
    orderId,
    amount,
    customer:{
      id: 'asdasdasdads',
    }
  })


  return reply.status(201).send()
})


app.listen({ host: '0.0.0.0', port: 3333}).then (() => {
  console.log('[Orders] is running')
})