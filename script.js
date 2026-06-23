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
const designationDialog = document.querySelector('#designation-dialog')
const designationList = document.querySelector('#designation-list')
const cancelDesignationBtn = document.querySelector('#cancel-designation-btn')
const editStructureDialog = document.querySelector('#edit-structure-dialog')
const structureTextInput = document.querySelector('#structure-text-input')
const editStructureKindInput = document.querySelector('#edit-structure-kind-input')
const editStructureKinds = document.querySelector('#edit-structure-kinds')
const editStructureLabelInput =
  document.querySelector('#edit-structure-label-input')
const applyStructureEditBtn = document.querySelector('#apply-structure-edit-btn')
const deleteStructureBtn = document.querySelector('#delete-structure-btn')
const cancelStructureEditBtn = document.querySelector('#cancel-structure-edit-btn')

let selectedRange = null
let editingRule = null
let editingColor = null
let editingStructure = null
let selectedDesignation = null
let originalRuleText = ''
let originalStructureText = ''
let originalStructureKind = ''
let originalStructureLabel = ''

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
  const offset = getClickOffset(event)

  if (offset === null) return

  const designations = findDesignationsAt(offset)

  if (!designations.length) return

  if (designations.length === 1) {
    chooseDesignation(designations[0])
    return
  }

  renderDesignationList(designations)
  designationDialog.showModal()
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

ruleTextInput.addEventListener('input', checkRuleChanges)

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

structureTextInput.addEventListener('input', checkStructureChanges)

editStructureKindInput.addEventListener('input', checkStructureChanges)

editStructureLabelInput.addEventListener('input', checkStructureChanges)

applyStructureEditBtn.addEventListener('click', () => {
  const newText = structureTextInput.value
  const newKind = editStructureKindInput.value.trim()
  const newLabel = editStructureLabelInput.value.trim()

  if (!newKind) {
    alert('Kind is required')
    return
  }

  const oldEnd = editingStructure.end
  const difference = newText.length - editingStructure.text.length

  replaceTextRange(editingStructure.start, editingStructure.end, newText)

  editingStructure.end = editingStructure.start + newText.length
  editingStructure.kind = newKind
  editingStructure.label = newLabel

  shiftFollowingRanges(oldEnd, difference, editingStructure.id)
  refreshStoredTexts()

  if (!state.structureKinds.includes(newKind)) {
    state.structureKinds.push(newKind)
  }

  saveState()
  render()
  editStructureDialog.close()
})

deleteStructureBtn.addEventListener('click', () => {
  state.structures = state.structures.filter(
    structure => structure !== editingStructure
  )

  saveState()
  editStructureDialog.close()
})

cancelStructureEditBtn.addEventListener('click', () => {
  editStructureDialog.close()
})

cancelDesignationBtn.addEventListener('click', () => {
  designationDialog.close()
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

function findDesignationsAt(offset) {
  const designations = []

  for (const coloring of state.coloring) {
    if (offset >= coloring.start && offset < coloring.end) {
      designations.push({
        type: 'coloring',
        item: coloring,
        size: coloring.end - coloring.start
      })
    }
  }

  for (const structure of state.structures) {
    if (offset >= structure.start && offset < structure.end) {
      designations.push({
        type: 'structure',
        item: structure,
        size: structure.end - structure.start
      })
    }
  }

  return designations.sort((a, b) => a.size - b.size)
}

function renderDesignationList(designations) {
  designationList.innerHTML = ''

  for (const designation of designations) {
    const button = document.createElement('button')
    const title = document.createElement('div')
    const code = document.createElement('pre')

    button.className = 'designation'
    title.className = 'designation-title'
    code.className = 'designation-code'

    if (designation.type === 'coloring') {
      title.textContent = '🎨 Coloring'
    }

    if (designation.type === 'structure') {
      title.textContent = `🏗️ ${designation.item.kind}`
    }

    code.textContent = designation.item.text
    button.append(title, code)
    designationList.append(button)

    button.addEventListener('click', () => {
      chooseDesignation(designation)
    })
  }
}

function chooseDesignation(designation) {
  designationDialog.close()

  if (designation.type === 'coloring') {
    openEditRule(designation.item)
  }

  if (designation.type === 'structure') {
    openEditStructure(designation.item)
  }
}

function openEditStructure(structure) {
  editingStructure = structure
  originalStructureText = structure.text
  originalStructureKind = structure.kind
  originalStructureLabel = structure.label
  structureTextInput.value = structure.text
  editStructureKindInput.value = structure.kind
  editStructureLabelInput.value = structure.label

  renderEditStructureKinds()

  applyStructureEditBtn.hidden = true
  editStructureDialog.showModal()
}

function getClickOffset(event) {
  const range = document.caretRangeFromPoint(event.clientX, event.clientY)

  if (!range) { return null }

  const preRange = range.cloneRange()

  preRange.selectNodeContents(codeView)
  preRange.setEnd(range.startContainer, range.startOffset)

  return preRange.toString().length
}

function renderEditStructureKinds() {
  editStructureKinds.innerHTML = ''

  for (const kind of state.structureKinds) {
    const button = document.createElement('button')

    button.textContent = kind

    button.addEventListener('click', () => {
      editStructureKindInput.value = kind
      checkStructureChanges()
    })

    editStructureKinds.append(button)
  }
}

function checkStructureChanges() {
  applyStructureEditBtn.hidden =
    structureTextInput.value === originalStructureText &&
    editStructureKindInput.value === originalStructureKind &&
    editStructureLabelInput.value === originalStructureLabel
}
