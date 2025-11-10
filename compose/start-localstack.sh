#!/bin/bash
export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

function create_topic() {
  local topic_name=$1
  local topic_arn=$(awslocal sns create-topic --name $topic_name --query "TopicArn" --output text)
  echo $topic_arn
}

function create_queue() {
  local queue_name=$1

  # Create the DLQ
  local dlq_url=$(
    awslocal sqs create-queue \
    --queue-name "$queue_name-dead-letter-queue" \
    --query "QueueUrl" --output text
  )

  local dlq_arn=$(
    awslocal sqs get-queue-attributes \
      --queue-url $dlq_url \
      --attribute-name "QueueArn" \
      --query "Attributes.QueueArn" \
      --output text
  )

  # Create the queue with DLQ attached
  local queue_url=$(
    awslocal sqs create-queue \
      --queue-name $queue_name \
      --attributes '{ "RedrivePolicy": "{\"deadLetterTargetArn\":\"'$dlq_arn'\",\"maxReceiveCount\":\"1\"}" }' \
      --query "QueueUrl" \
      --output text
  )

  local queue_arn=$(
    awslocal sqs get-queue-attributes \
      --queue-url $queue_url \
      --attribute-name "QueueArn" \
      --query "Attributes.QueueArn" \
      --output text
  )

  echo $queue_arn
}

function subscribe_queue_to_topic() {
  local topic_arn=$1
  local queue_arn=$2

  awslocal sns subscribe --topic-arn $topic_arn --protocol sqs --notification-endpoint $queue_arn --attributes '{ "RawMessageDelivery": "true" }'
}

function create_topic_and_queue() {
  local topic_name=$1
  local queue_name=$2

  local topic_arn=$(create_topic $topic_name)
  local queue_arn=$(create_queue $queue_name)

  subscribe_queue_to_topic $topic_arn $queue_arn
}

create_topic_and_queue "ahwr_payment_update" "ahwr_application_backend_queue" &
create_topic_and_queue "ahwr_document_request" "ahwr_document_generator_queue" &
create_topic_and_queue "ahwr_reminder_request" "ahwr_message_generator_queue" &
create_topic_and_queue "ahwr_status_change" "ahwr_message_generator_queue"

wait

awslocal sqs list-queues
awslocal sns list-topics

echo "SNS/SQS ready"

# Add an example message to the ahwr_payment_update topic ready for processing from queue
#awslocal sns publish --topic-arn arn:aws:sns:eu-west-2:000000000000:ahwr_payment_update --message '{"crn":"1101663919","reference":"IAHW-QE9R-KDSP","sbi":"106639701","startDate":"2025-07-16T14:27:19.841Z","userType":"newUser","email":"peterevansu@snavereteps.com.test","farmerName":"Peter Evans","name":"Oaklands Farm","orgEmail":"oaklandsfarmm@mrafsdnalkaok.com.test"}' --message-attributes '{"messageType":{"DataType":"String","StringValue":"uk.gov.defra.ahwr.document.request"}}'

