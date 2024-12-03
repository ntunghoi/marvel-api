## Environment setup

```bash
# Initialize yarn
yarn init

# setup Nx
npx nx@latest init

# Generate a project for the API module
yarn nx generate @nx/node:application apps/api --e2eTestRunner none --directory apps/api --bundler esbuild --framework none --verbose
```
