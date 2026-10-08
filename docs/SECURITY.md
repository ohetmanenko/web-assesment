# Original template cleanup

## Finding and evidence

The originally imported `Api/middlewares/swagger.js` is an obfuscated multistage remote-code loader rather than Swagger documentation. Static decoding identified code that writes JavaScript/VBS under the user's `.vs_cache`, installs additional packages, launches hidden processes and evaluates remotely obtained JavaScript using blockchain APIs.

Original SHA-256:

```text
35be764c39fa9e27b2d0300c94b1565a68746f8b85f48a1bd1b538ca1d45056a
```

The exact original is retained locally at `.local/security-evidence/swagger.original.txt`, excluded from Git and from the clean export. Do not execute or rename it to an executable source extension. Analysis did not execute the payload.

The user reported only cloning the repository before cleanup. The expected `.vs_cache` path was absent at the time of inspection. These observations do not constitute a full forensic examination or establish who introduced the code.

## Changes

- Removed the loader from the working tree.
- Replaced automatic startup route loading with explicit reviewed auth and transaction imports.
- Removed template dependencies unused by the API and frontend.
- Removed authentication bypasses and restored bcrypt/JWT checks.
- Excluded evidence, local env files, IDE state and generated files from Git.
- Removed env files from the Git index while preserving local copies.
- Added an allowlisted clean export for future publication.

Unrelated template source files remain inactive in the original working checkout. They are excluded from the clean export. The checkout's old Git history remains intact for provenance and still contains the loader and old env files. Never publish that history or use it as the base for the final submission repository.

## Draft to clarify provenance — not sent

“Hi, while reviewing the assessment template before running it, I found obfuscated code in Api/middlewares/swagger.js that launches hidden processes and evaluates remote JavaScript. It is imported during API startup. Could you confirm the intended repository and provide a verified clean copy or explain this file's purpose? I have preserved the original file and its SHA-256 and removed it from my local implementation.”

Confirm the intended recipient and wording before sending. No recruiter message, publication or form submission has been performed.
