# Code to Figma Layout Importer (бесплатный плагин)

Этот проект — ваш собственный плагин для Figma, который переносит структуру из кода (HTML + CSS) в макеты Figma.

## Что умеет сейчас

- Импортирует HTML-структуру в слои Figma.
- Применяет базовые CSS-стили:
  - цвета текста и фона,
  - размеры шрифтов,
  - padding,
  - border-radius,
  - flex + gap.
- Создаёт отдельные фреймы под брейкпоинты (например mobile / tablet / desktop).
- Ставит Auto Layout для блоков, где есть `display: flex`.

## Ограничения текущей версии (честно)

Чтобы плагин работал стабильно и без платных сервисов, в первой версии есть ограничения:

- Поддерживается HTML + CSS (без полноценной поддержки React/Vue/Angular JSX/TSX из коробки).
- Сложные CSS-селекторы и продвинутые эффекты могут переноситься частично.
- Картинки пока создаются как placeholder-блоки.

## Как запустить (очень просто)

1. Скачайте/откройте этот проект локально.
2. В Figma откройте: **Plugins → Development → Import plugin from manifest…**
3. Выберите файл `manifest.json`.
4. Запустите плагин из раздела Development.
5. В окне плагина:
   - выберите ваш `.html` файл,
   - выберите один или несколько `.css` файлов,
   - проверьте брейкпоинты (по умолчанию уже заполнены),
   - нажмите **«Создать макеты в Figma»**.


## Как добавить проект в GitHub (пошагово, для новичка)

Ниже самый простой сценарий, если у вас уже есть GitHub-аккаунт.

### 1) Подготовьте папку проекта

В папке должны быть файлы:

- `manifest.json`
- `code.js`
- `ui.html`
- `README.md`

### 2) Откройте терминал в этой папке

Если у вас VS Code, нажмите: **Terminal → New Terminal**.

### 3) Выполните команды по очереди

```bash
git init
git add .
git commit -m "Initial commit: Code to Figma plugin"
```

### 4) Создайте пустой репозиторий на GitHub

1. Зайдите на GitHub.
2. Нажмите **New repository**.
3. Назовите, например: `code-to-figma-plugin`.
4. Нажмите **Create repository**.

### 5) Привяжите локальную папку к GitHub

Скопируйте URL вашего репозитория (пример: `https://github.com/USERNAME/code-to-figma-plugin.git`)
и выполните:

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/code-to-figma-plugin.git
git push -u origin main
```

Готово — файлы появятся на GitHub.

### Если видите ошибку `remote origin already exists`

Значит remote уже добавлен. Используйте:

```bash
git remote -v
git remote set-url origin https://github.com/USERNAME/code-to-figma-plugin.git
git push -u origin main
```

### Если Git просит логин/пароль

Используйте вход через браузер или Personal Access Token (PAT), это нормальная ситуация для GitHub.

## Структура проекта

- `manifest.json` — описание плагина для Figma.
- `ui.html` — интерфейс, где вы загружаете файлы и задаёте брейкпоинты.
- `code.js` — логика создания слоёв/фреймов в Figma.

## Что можно улучшить следующим шагом

- Добавить импорт ZIP-архива проекта.
- Добавить обработку React-компонентов (через отдельный парсер).
- Более точная поддержка margin и сложных layout-кейсов.
- Поддержка дизайн-токенов (цвета, типографика, spacing) из JSON.

---

Если хотите, следующим шагом я могу расширить эту версию под ваш конкретный стек (например: React + Tailwind или Next.js), чтобы перенос был точнее.
