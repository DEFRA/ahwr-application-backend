import Boom from '@hapi/boom'
import { getApplicationWithFullFlags } from '../../../repositories/application-repository.js'
import { getClaimByReference } from '../../../repositories/claim-repository.js'
import { getAllHerdVersionsById } from '../../../repositories/herd-repository.js'
import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { config } from '../../../config/config.js';

export const getSupportApplication = async ({ db, reference }) => {
  const application = await getApplicationWithFullFlags({ db, reference })

  if (!application) {
    throw Boom.notFound('Application not found')
  }

  return application
}

export const getSupportClaim = async ({ db, reference }) => {
  const claim = await getClaimByReference(db, reference)

  if (!claim) {
    throw Boom.notFound('Claim not found')
  }

  return claim
}

export const getSupportHerd = async ({ db, id }) => {
  const claim = await getAllHerdVersionsById(db, id)

  if (!claim) {
    throw Boom.notFound('Herd not found')
  }

  return claim
}

export const getQueueMessages = async ({ queueUrl, limit, logger }) => {
  const client = new SQSClient({ region: config.get('aws.region'), endpoint: config.get('aws.endpointUrl') });

  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: limit,
    VisibilityTimeout: 2,
    WaitTimeSeconds: 0,
    AttributeNames: ["All"],
    MessageAttributeNames: ["All"],
  });
  const res = await client.send(command);

  logger.info(`Retrieved ${res.Messages?.length || 0} messages`);

  return (res.Messages || []).map((msg) => ({
    id: msg.MessageId,
    body: msg.Body,
    attributes: msg.Attributes,
    messageAttributes: msg.MessageAttributes,
  }));
};