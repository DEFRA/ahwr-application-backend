#!/bin/bash
export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

function create_bucket() {
  local bucket_name=$1
  echo "Creating S3 bucket: $bucket_name"
  awslocal s3api create-bucket \
  --bucket "$bucket_name" \
  --create-bucket-configuration LocationConstraint=eu-west-2
}

function upload_pdf() {
  local bucket_name="local-ahwr-documents"
  local key_path="123456789/IAHW-G3CL-V59P.pdf"
  local local_path="/etc/localstack/init/fixtures/testing-doc.pdf"

  if [[ ! -f "$local_path" ]]; then
  echo "PDF not found at: $local_path"
  exit 1
  fi

  echo "Uploading $local_path to s3://$bucket_name/$key_path"

  awslocal s3 cp "$local_path" "s3://$bucket_name/$key_path"
}

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
create_topic_and_queue "ahwr_status_change" "ahwr_message_generator_queue" &
create_bucket "local-ahwr-documents"
upload_pdf

wait

awslocal sqs list-queues
awslocal sns list-topics
awslocal s3api list-buckets

echo "SNS/SQS/S3 ready"

# Set claim to paid
awslocal sns publish --topic-arn arn:aws:sns:eu-west-2:000000000000:ahwr_payment_update --message '{"sbi":"123456789","claimRef":"FUBC-JTTU-SDQ7"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"uk.gov.ffc.ahwr.set.paid.status"}}'

