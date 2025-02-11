# MARK: Development
bun run \
    --define TX_PRERELEASE_EXPIRATION="0" \
    --define global="globalThis" \
    --watch \
    --env-file .env \
    core/bunEntrypoint.ts

# NOTE: with --watch we might not need the dev script anymore


# MARK: Production
bun build core/bunEntrypoint.ts \
    --define TX_PRERELEASE_EXPIRATION="0" \
    --define global="globalThis" \
    --compile \
    --outfile txadmin.exe

# NOTE: Check the required flags:
# https://bun.sh/docs/bundler/executables#deploying-to-production

# NOTE: When adding icon the exe doesn't work (it stats bun and not tx)
# --windows-icon txlogo.ico

# NOTE: Might not need to define global
