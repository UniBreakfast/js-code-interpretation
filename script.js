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
  codeView.textContent = state.code
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


render()
