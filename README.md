# Correção de provas

Aplicação web estática para professores da EEEP Luizete Albano de Freitas Menezes.

## Publicação no GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica automaticamente o site após cada envio para a branch `main`.

1. Crie no GitHub um repositório **público** chamado `correcao-eeep`.
2. Envie os arquivos deste projeto para a branch `main`.
3. No repositório, acesse **Settings > Pages** e selecione **GitHub Actions** como origem da publicação.
4. Acompanhe o workflow na aba **Actions**. Depois que ele terminar, o site ficará disponível em:
   `https://edichandsoncosta-lgtm.github.io/correcao-eeep/`

O GitHub Pages publica o site pela internet. O código-fonte deste repositório público também poderá ser visto por qualquer pessoa.

## Acesso e dados

- O login dos professores usa o Supabase configurado em `supabase-config.js`.
- A chave `sb_publishable_...` é uma chave pública de cliente. Nunca coloque uma chave `service_role` neste projeto.
- Alunos, gabaritos e resultados são salvos no armazenamento local do navegador. Eles não são sincronizados automaticamente entre o computador e o celular; cada aparelho mantém seus próprios dados.
