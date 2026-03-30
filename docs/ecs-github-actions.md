# ECS GitHub Actions Auto Deploy

This project can auto-deploy to the Hong Kong ECS instance by using a GitHub Actions self-hosted runner on the server itself.

## Why This Approach

- No need to expose SSH on port `22`
- Works with the current Session Manager workflow
- Keeps deployment logic close to the server that actually runs Docker

## One-Time ECS Setup

Run these commands on the ECS instance as `ecs-assist-user`.

### 1. Make sure Docker is usable without sudo

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker ecs-assist-user
```

After that, log out and reconnect once so the new group takes effect.

### 2. Install a self-hosted GitHub Actions runner

In GitHub:

- Open `Axiaohungry/personal-web`
- Go to `Settings -> Actions -> Runners`
- Click `New self-hosted runner`
- Choose `Linux` and `x64`

Then run the generated commands on ECS, but add the label `ecs-personal-web` when configuring the runner.

Typical flow:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
# download the runner tarball shown in GitHub
# extract it
./config.sh --url https://github.com/Axiaohungry/personal-web --token <temporary-token> --labels ecs-personal-web
sudo ./svc.sh install
sudo ./svc.sh start
```

## GitHub Secrets / Variables

Repository settings:

- `Settings -> Secrets and variables -> Actions`

Add:

- Secret: `FITNESS_API_UPSTREAM_BASE_URL`
  - Value: `https://personal-web-blue-six.vercel.app`

Optional:

- Secret: `GEMINI_API_KEY`
- Variable: `GEMINI_MODEL`

For the Hong Kong ECS deployment, the recommended mode is to set only `FITNESS_API_UPSTREAM_BASE_URL` and let ECS proxy `/api/fitness/*` to Vercel.

## How Deploy Works

Workflow file:

- `.github/workflows/deploy-ecs.yml`

Deploy script:

- `scripts/ecs/deploy.sh`

When code is pushed to `main`:

1. GitHub Actions schedules the workflow on the ECS self-hosted runner
2. The runner checks out the latest code
3. The deploy script rebuilds the Docker image
4. The old container is replaced
5. The script checks `http://127.0.0.1:3000/healthz`

## Manual Trigger

You can also trigger the workflow manually from:

- `GitHub -> Actions -> Deploy ECS -> Run workflow`
