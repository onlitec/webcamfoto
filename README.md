# Módulo Webcamfoto para Dolibarr

Este módulo adiciona a funcionalidade de capturar fotos diretamente da webcam para produtos no Dolibarr.

## Recursos

- Botão "Capturar foto" na página de produtos
- Interface amigável e moderna para captura de imagens via webcam
- Modal interativo (redimensionável, arrastável, com botões de minimizar/maximizar)
- Botões coloridos para melhor experiência do usuário
- Salvamento de fotos no diretório do produto
- Mensagens de feedback na própria interface
- Suporte para múltiplas capturas em sequência

## Requisitos

- Dolibarr 12.0 ou superior
- PHP 7.1 ou superior
- Navegador moderno com suporte à API MediaDevices
- Permissão para acessar a webcam do usuário
- Módulo "Produtos" ativado

## Instalação

1. Descompacte o arquivo do módulo no diretório `htdocs/custom/` do seu Dolibarr
2. Vá para Início > Configuração > Módulos
3. Encontre o módulo "Webcamfoto" na seção "Produtos" e ative-o

## Uso

1. Vá para a página de um produto (novo ou existente)
2. Você verá um botão "Capturar Foto" entre as ações disponíveis
3. Clique nesse botão para abrir a interface da webcam
4. Conceda permissão para acessar a câmera quando solicitado pelo navegador
5. Capture a foto usando o botão azul "Capturar Foto"
6. Se necessário, clique no botão amarelo "Nova Foto" para tentar novamente
7. Clique no botão verde "Salvar Foto" para salvar a imagem capturada
8. Uma mensagem de sucesso aparecerá na janela
9. Você pode capturar mais fotos ou fechar a janela quando terminar
10. Ao fechar a janela, a página será recarregada e mostrará todas as fotos capturadas

## Solução de problemas

- **Erro "Nenhuma webcam detectada"**: Verifique se sua webcam está conectada e funcionando corretamente
- **Erro de permissão**: Certifique-se de que você concedeu permissão para o navegador acessar sua webcam
- **Imagem não salva**: Verifique as permissões de escrita no diretório `documents/products/`

## Segurança

O módulo utiliza tecnologias modernas do navegador para acessar a webcam. Os dados são transmitidos de forma segura usando Fetch API com cabeçalhos de segurança apropriados.

## Licença

GPL v3 ou posterior

---

Versão 1.0.0
Atualizado em Maio/2025
