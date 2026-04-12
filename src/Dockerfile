FROM mcr.microsoft.com/devcontainers/javascript-node:1-18-bullseye

RUN apt update && \
    apt install -y software-properties-common apt-transport-https ca-certificates gnupg git tree curl wget bat gpg ripgrep stow cmake tmux fd-find direnv zip unzip

RUN ln -snf /bin/bash /bin/sh

# Create the workspace directory
RUN mkdir -p /workspace
WORKDIR /workspace

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
