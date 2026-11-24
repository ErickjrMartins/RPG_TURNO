import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'attachments/**', 'work/**', 'scratch/**', 'shared/**', 'library-files/**', 'sites/reinos-da-aurora/**'] },
  ...tseslint.configs.recommended,
)
