const STORAGE_KEY = 'js-coloring-tool'

const state = loadState()
const codeView = document.querySelector('#code-view')
const feedCodeBtn = document.querySelector('#feed-code-btn')
const coloringBtn = document.querySelector('#rules-btn')
const feedCodeDialog = document.querySelector('#feed-code-dialog')
const coloringDialog = document.querySelector('#rules-dialog')
const codeInput = document.querySelector('#code-input')
const coloringView = document.querySelector('#rules-view')
const applyCodeBtn = document.querySelector('#apply-code-btn')
const cancelCodeBtn = document.querySelector('#cancel-code-btn')
const closeColoringBtn = document.querySelector('#close-rules-btn')
const palette = document.querySelector('#palette')
const editRuleDialog = document.querySelector('#edit-rule-dialog')
const ruleTextInput = document.querySelector('#rule-text-input')
const editPalette = document.querySelector('#edit-palette')
const applyRuleBtn = document.querySelector('#apply-rule-btn')
const removeRuleBtn = document.querySelector('#remove-rule-btn')
const cancelRuleBtn = document.querySelector('#cancel-rule-btn')
const structuresBtn = document.querySelector('#structures-btn')
const structuresDialog = document.querySelector('#structures-dialog')
const structuresView = document.querySelector('#structures-view')
const closeStructuresBtn = document.querySelector('#close-structures-btn')
const createStructureBtn = document.querySelector('#create-structure-btn')
const createStructureDialog = document.querySelector('#create-structure-dialog')
const structureKindInput = document.querySelector('#structure-kind-input')
const structureLabelInput = document.querySelector('#structure-label-input')
const structureKinds = document.querySelector('#structure-kinds')
const applyStructureBtn = document.querySelector('#apply-structure-btn')
const cancelStructureBtn = document.querySelector('#cancel-structure-btn')

let selectedRange = null
let editingRule = null
let editingColor = null
let originalRuleText = ''

feedCodeBtn.addEventListener('click', () => {
  codeInput.value = state.code
  feedCodeDialog.showModal()
})

cancelCodeBtn.addEventListener('click', () => {
  feedCodeDialog.close()
})

applyCodeBtn.addEventListener('click', () => {
  state.code = codeInput.value
  state.coloring = []
  state.structures = []
  state.structureKinds = []

  saveState()
  render()

  feedCodeDialog.close()
})

coloringBtn.addEventListener('click', () => {
  coloringView.textContent = JSON.stringify(
    state.coloring,
    null,
    2
  )

  coloringDialog.showModal()
})

closeColoringBtn.addEventListener('click', () => {
  coloringDialog.close()
})

codeView.addEventListener('mouseup', () => {
  const selection = window.getSelection()

  if (!selection.toString()) {
    palette.hidden = true
    return
  }

  const offsets = getSelectionOffsets()

  if (!offsets) {
    return
  }

  selectedRange = {
    ...offsets,
    text: selection.toString()
  }

  const rect =
    selection
      .getRangeAt(0)
      .getBoundingClientRect()

  palette.style.left = `${rect.left}px`
  palette.style.top = `${rect.bottom + 5}px`

  palette.hidden = false
})

palette.addEventListener('click', event => {
  const color = event.target.dataset.color

  if (!color || !selectedRange) {
    return
  }

  const {
    start,
    end,
    text
  } = selectedRange


  if (overlaps(start, end)) {
    alert('Selection overlaps existing coloring')
    return
  }


  state.coloring.push({
    id: crypto.randomUUID(),
    start,
    end,
    text,
    color
  })

  saveState()
  render()

  palette.hidden = true
  selectedRange = null
})

codeView.addEventListener('click', event => {
  const span = event.target.closest('[data-rule-id]')

  if (!span) return

  const rule = state.coloring.find(
    rule => rule.id === span.dataset.ruleId
  )

  if (!rule) return

  openEditRule(rule)
})

editPalette.addEventListener('click', event => {
  const color = event.target.dataset.color

  if (!color) {
    return
  }

  editingColor = color

  checkRuleChanges()
})

applyRuleBtn.addEventListener('click', () => {
  const oldLength = editingRule.text.length
  const newText = ruleTextInput.value
  const difference = newText.length - oldLength
  const oldEnd = editingRule.end

  replaceTextRange(editingRule.start, oldEnd, newText)

  editingRule.text = newText
  editingRule.end = editingRule.start + newText.length
  editingRule.color = editingColor
  
  shiftFollowingRanges(oldEnd, difference, editingRule.id)
  refreshStoredTexts()
  saveState()
  render()

  editRuleDialog.close()
})

removeRuleBtn.addEventListener('click', () => {
  state.coloring =
    state.coloring.filter(
      rule => rule !== editingRule
    )

  saveState()
  render()

  editRuleDialog.close()
})

ruleTextInput.addEventListener(
  'input',
  checkRuleChanges
)

cancelRuleBtn.addEventListener('click', () => {
  editRuleDialog.close()
})

structuresBtn.addEventListener('click', () => {
  structuresView.textContent =
    JSON.stringify(
      state.structures,
      null,
      2
    )

  structuresDialog.showModal()
})

closeStructuresBtn.addEventListener('click', () => {
  structuresDialog.close()
})

createStructureBtn.addEventListener('click', () => {
  if (!selectedRange) return

  renderStructureKinds()

  structureKindInput.value = ''
  structureLabelInput.value = ''

  createStructureDialog.showModal()

  palette.hidden = true
})

applyStructureBtn.addEventListener('click', () => {
  const kind =
    structureKindInput.value.trim()

  if (!kind) {
    alert('Kind is required')
    return
  }

  const label =
    structureLabelInput.value.trim()

  const {
    start,
    end,
    text
  } = selectedRange

  if (
    structureConflicts(
      start,
      end
    )
  ) {
    alert(
      'Invalid structure nesting'
    )

    return
  }

  state.structures.push({
    id: crypto.randomUUID(),
    start,
    end,
    text,
    kind,
    label
  })

  if (
    !state.structureKinds.includes(
      kind
    )
  ) {
    state.structureKinds.push(
      kind
    )
  }

  saveState()

  createStructureDialog.close()

  selectedRange = null
})

cancelStructureBtn.addEventListener('click', () => {
  createStructureDialog.close()
})

render()

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return {
      code: '',
      coloring: []
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

  const coloring = [...state.coloring]
    .sort((a, b) => a.start - b.start)

  for (const rule of coloring) {
    html += escapeHtml(
      state.code.slice(position, rule.start)
    )
    html += `<span 
      data-rule-id="${rule.id}" 
      style="color:${rule.color}; cursor:pointer"
    >`
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
  return state.coloring.some(rule =>
    start < rule.end &&
    end > rule.start
  )
}

function openEditRule(rule) {
  editingRule = rule
  editingColor = rule.color
  originalRuleText = rule.text

  ruleTextInput.value = rule.text

  applyRuleBtn.hidden = true

  editRuleDialog.showModal()
}

function checkRuleChanges() {
  applyRuleBtn.hidden =
    ruleTextInput.value === originalRuleText &&
    editingColor === editingRule.color
}

function getSelectionOffsets() {
  const selection = window.getSelection()

  if (!selection.rangeCount) {
    return null
  }

  const range = selection.getRangeAt(0)

  const preRange = range.cloneRange()

  preRange.selectNodeContents(codeView)
  preRange.setEnd(
    range.startContainer,
    range.startOffset
  )

  const start = preRange.toString().length

  return {
    start,
    end: start + selection.toString().length
  }
}

function structureConflicts(start, end) {
  return state.structures.some(
    structure => {

      const same =
        start === structure.start &&
        end === structure.end

      const crossing =
        start < structure.start &&
        end > structure.start &&
        end < structure.end

      const crossedBy =
        structure.start < start &&
        structure.end > start &&
        structure.end < end

      return same ||
        crossing ||
        crossedBy
    }
  )
}

function renderStructureKinds() {
  structureKinds.innerHTML = ''

  for (const kind of state.structureKinds) {
    const button = document.createElement('button')

    button.textContent = kind

    button.addEventListener('click', () => {
      structureKindInput.value = kind
    })

    structureKinds.append(button)
  }
}

function shiftFollowingRanges(oldEnd, difference, excludedId) {
  for (const item of state.coloring) {
    if (item.id === excludedId) continue

    if (item.start >= oldEnd) {
      item.start += difference
      item.end += difference
    }
  }

  for (const item of state.structures) {
    if (item.id === excludedId) continue

    if (item.start >= oldEnd) {
      item.start += difference
      item.end += difference
    }
  }
}

function replaceTextRange(start, end, newText) {
  state.code =
    state.code.slice(0, start) + newText + state.code.slice(end)
}

function refreshStoredTexts() {
  for (const item of state.coloring) {
    item.text =
      state.code.slice(
        item.start,
        item.end
      )
  }

  for (const item of state.structures) {
    item.text =
      state.code.slice(
        item.start,
        item.end
      )
  }
}
