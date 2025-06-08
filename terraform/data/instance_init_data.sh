#!/bin/bash

# Update packages
yum update -y

amazon-linux-extras enable corretto21
yum install -y java-21-amazon-corretto

APP_DIR="/home/ec2-user/team_one"
JAR_NAME="todo-0.0.1-app.jar"


mkdir -p "$APP_DIR"
cd "$APP_DIR"

# (Optional) Download the JAR from S3 or another location
# aws s3 cp s3://your-bucket-name/$JAR_NAME .


cat <<EOF > /etc/systemd/system/team_one.service
[Unit]
Description=Team One Java Backend Service
After=network.target

[Service]
User=ec2-user
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/java -jar $APP_DIR/$JAR_NAME
SuccessExitStatus=143
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

chmod 644 /etc/systemd/system/team_one.service
systemctl daemon-reexec
systemctl daemon-reload
systemctl enable team_one
systemctl start team_one
