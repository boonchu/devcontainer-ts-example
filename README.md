# Try Out Development Containers: Typescript

[Open in Dev Containers](https://github.com/microsoft/vscode-remote-try-node)

A **development container** is a running container with a well-defined tool/runtime stack and its prerequisites. You can try out development containers with **[GitHub Codespaces](https://github.com/features/codespaces)** or **[Visual Studio Code Dev Containers](https://aka.ms/vscode-remote/containers)**.

## Setting up the development container

### VS Code Dev Containers

If you already have VS Code and Docker installed, you can click the badge above or [here](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/microsoft/vscode-remote-try-node) to get started. Clicking these links will cause VS Code to automatically install the Dev Containers extension if needed, clone the source code into a container volume, and spin up a dev container for use.

Follow these steps to open this sample in a container using the VS Code Dev Containers extension:

1. #### If this is your first time using a WSL2 development container, please ensure your system meets the pre-reqs:
   - Install Docker service in WSL2.
   - Ensure the NVIDIA GPU driver is installed.
   - Installing [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-container-toolkit).

```
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. #### How to run example:
- If you want to start devcontainer from cli, you need to install devcontainer first. Otherwise let's vscode to handle everything for you.
```
npm install -g @devcontainers/cli
devcontainer up
```
- Run Curl
```
curl -X POST http://localhost:3000/v1/completions   -H "Content-Type: application/json" -s  -d '{
    "model": "microsoft/phi-1_5",
    "prompt": "Explain the privacy policy in simple terms.",
    "max_tokens": 350
  }' | jq -r .choices[].text

# results from my MX450 GPU (TTFT: 1 minute)
[GIN] 2026/04/12 - 20:08:21 | 200 |          1m1s |      172.18.0.3 | POST     "/api/generate"
[GIN] 2026/04/12 - 20:10:21 | 200 | 36.227724978s |      172.18.0.3 | POST     "/api/generate"

curl http://localhost:3000/v1/chat/completions  \
  -H "Content-Type: application/json"   -d '{
    "model": "microsoft/phi-1_5",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

3. #### Watch load from `nvtop` or NVIDIA Control Panel

```
docker run --rm -t --gpus all nvidia/cuda:12.9.0-base-ubuntu22.04 bash -c "apt-get update && apt-get install -y nvtop && nvtop"
```

4. #### When devcontainer cannot start `vllm`, try to troubleshoot it from top level:

```
# --> Most cleaning way: Access "Remote Explorer" and delete all instance from "DEV CONTAINER" list.
docker stop devcontainer-ts-example_devcontainer-app-1 devcontainer-ts-example_devcontainer-vllm-1
docker rm devcontainer-ts-example_devcontainer-app-1 devcontainer-ts-example_devcontainer-vllm-1
rm -rf /tmp/devcontainercli-*
devcontainer up
docker logs devcontainer-ts-example_devcontainer-vllm-1 -f
```
