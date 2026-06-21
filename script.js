const STORAGE_KEY = 'js-coloring-tool'

const state = loadState()

const codeView = document.querySelector('#code-view')

const feedCodeBtn = document.querySelector('#feed-code-btn')
const rulesBtn = document.querySelector('#rules-btn')

const feedCodeDialog = document.querySelector('#feed-code-dialog')
const rulesDialog = document.querySelector('#rules-dialog')

const codeInput = document.querySelector('#code-input')
const rulesView = document.querySelector('#rules-view')

const applyCodeBtn = document.querySelector('#apply-code-btn')
const cancelCodeBtn = document.querySelector('#cancel-code-btn')
const closeRulesBtn = document.querySelector('#close-rules-btn')

const palette = document.querySelector('#palette')

let pendingSelection = null

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return {
      code: '',
      rules: []
    }
  }

  return JSON.parse(saved)
}


function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  )
}


function render() {
  let html = ''
  let position = 0

  const rules = [...state.rules]
    .sort((a, b) => a.start - b.start)

  for (const rule of rules) {
    html += escapeHtml(
      state.code.slice(position, rule.start)
    )

    html += `<span style="color:${rule.color}">`
    html += escapeHtml(rule.text)
    html += '</span>'

    position = rule.end
  }

  html += escapeHtml(
    state.code.slice(position)
  )

  codeView.innerHTML = html
}


function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}


function overlaps(start, end) {
  return state.rules.some(rule =>
    start < rule.end &&
    end > rule.start
  )
}


feedCodeBtn.addEventListener('click', () => {
  codeInput.value = state.code
  feedCodeDialog.showModal()
})


cancelCodeBtn.addEventListener('click', () => {
  feedCodeDialog.close()
})


applyCodeBtn.addEventListener('click', () => {
  state.code = codeInput.value
  state.rules = []

  saveState()
  render()

  feedCodeDialog.close()
})


rulesBtn.addEventListener('click', () => {
  rulesView.textContent = JSON.stringify(
    state.rules,
    null,
    2
  )

  rulesDialog.showModal()
})


closeRulesBtn.addEventListener('click', () => {
  rulesDialog.close()
})


codeView.addEventListener('mouseup', () => {
  const selection = window.getSelection()

  if (!selection.toString()) {
    palette.hidden = true
    return
  }

  const text = selection.toString()

  const start = state.code.indexOf(text)

  if (start === -1) {
    return
  }

  const end = start + text.length

  pendingSelection = {
    start,
    end,
    text
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect()

  palette.style.left = `${rect.left}px`
  palette.style.top = `${rect.bottom + 5}px`

  palette.hidden = false
})


palette.addEventListener('click', event => {
  const color = event.target.dataset.color

  if (!color || !pendingSelection) {
    return
  }

  const {
    start,
    end,
    text
  } = pendingSelection


  if (overlaps(start, end)) {
    alert('Selection overlaps existing coloring')
    return
  }


  state.rules.push({
    id: crypto.randomUUID(),
    start,
    end,
    text,
    color
  })

  saveState()
  render()

  palette.hidden = true
  pendingSelection = null
})


render()
