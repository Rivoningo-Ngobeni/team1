class DragDropManager {
  constructor() {
    this.selectedTodo = null
    this.keyboardMode = false
    this.statusColumns = ["open", "in_progress", "closed"]
    this.announcements = []
  }

  init(container) {
    this.container = container
    this.setupDropZones()
    this.setupKeyboardNavigation()
  }

  setupDropZones() {
    const columns = this.container.querySelectorAll(".kanban-column")

    columns.forEach((column) => {
      const dropZone = column.querySelector(".drop-zone")
      const status = column.dataset.status

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"

        const dragData = this.getDragData(e)
        if (dragData && this.canDropInStatus(dragData.currentStatus, status)) {
          dropZone.classList.add("drag-over")
          this.showDropIndicator(dropZone, e)
        } else {
          dropZone.classList.add("drag-invalid")
        }
      })

      dropZone.addEventListener("dragleave", (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
          dropZone.classList.remove("drag-over", "drag-invalid")
          this.hideDropIndicator(dropZone)
        }
      })

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault()
        dropZone.classList.remove("drag-over", "drag-invalid")
        this.hideDropIndicator(dropZone)

        const dragData = this.getDragData(e)
        if (dragData && this.canDropInStatus(dragData.currentStatus, status)) {
          this.handleDrop(dragData.todoId, dragData.currentStatus, status)
        }
      })
    })
  }

  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      if (this.keyboardMode && this.selectedTodo) {
        this.handleKeyboardNavigation(e)
      }
    })
  }

  getDragData(e) {
    try {
      return JSON.parse(e.dataTransfer.getData("text/plain"))
    } catch {
      return null
    }
  }

  canDropInStatus(currentStatus, targetStatus) {
    
    return currentStatus !== targetStatus || true
  }

  showDropIndicator(dropZone, e) {
    this.hideDropIndicator(dropZone)

    const todos = Array.from(dropZone.querySelectorAll(".draggable-todo"))
    const afterElement = this.getDragAfterElement(dropZone, e.clientY)

    const indicator = document.createElement("div")
    indicator.className = "drop-indicator active"
    indicator.setAttribute("aria-hidden", "true")

    if (afterElement == null) {
      dropZone.appendChild(indicator)
    } else {
      dropZone.insertBefore(indicator, afterElement)
    }
  }

  hideDropIndicator(dropZone) {
    const indicator = dropZone.querySelector(".drop-indicator")
    if (indicator) {
      indicator.remove()
    }
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".draggable-todo:not(.dragging)")]

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element
  }

  handleDrop(todoId, fromStatus, toStatus) {
    if (fromStatus === toStatus) {
      this.announceToScreenReader(`Task reordered within ${this.getStatusLabel(toStatus)} column`)
      return
    }

    this.announceToScreenReader(
      `Task moved from ${this.getStatusLabel(fromStatus)} to ${this.getStatusLabel(toStatus)}`,
    )

    
    this.container.dispatchEvent(
      new CustomEvent("todo-status-change", {
        detail: { todoId, fromStatus, toStatus },
        bubbles: true,
      }),
    )
  }

  handleKeyboardSelect(todoId, status) {
    this.selectedTodo = { id: todoId, status }
    this.keyboardMode = true
    this.announceToScreenReader(
      `Task selected. Use arrow keys to move between columns, Space to drop, Escape to cancel`,
    )
  }

  handleKeyboardDeselect() {
    this.selectedTodo = null
    this.keyboardMode = false
    this.announceToScreenReader(`Task deselected`)
  }

  handleKeyboardMove(direction, currentStatus) {
    if (!this.selectedTodo) return

    let targetStatus = currentStatus
    const currentIndex = this.statusColumns.indexOf(currentStatus)

    switch (direction) {
      case "left":
        if (currentIndex > 0) {
          targetStatus = this.statusColumns[currentIndex - 1]
        }
        break
      case "right":
        if (currentIndex < this.statusColumns.length - 1) {
          targetStatus = this.statusColumns[currentIndex + 1]
        }
        break
      case "up":
      case "down":
        
        this.announceToScreenReader(`Use left and right arrows to move between columns`)
        return
    }

    if (targetStatus !== currentStatus) {
      this.handleDrop(this.selectedTodo.id, currentStatus, targetStatus)
      this.selectedTodo.status = targetStatus
    } else {
      this.announceToScreenReader(`Already at ${direction === "left" ? "first" : "last"} column`)
    }
  }

  getStatusLabel(status) {
    const labels = {
      open: "Open",
      in_progress: "In Progress",
      closed: "Completed",
    }
    return labels[status] || status
  }

  announceToScreenReader(message) {
    
    this.announcements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })
    this.announcements = []

    
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message
    document.body.appendChild(announcement)

    this.announcements.push(announcement)

    
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement)
      }
      this.announcements = this.announcements.filter((el) => el !== announcement)
    }, 1000)
  }

  destroy() {
    this.selectedTodo = null
    this.keyboardMode = false
    this.announcements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })
    this.announcements = []
  }
}

export default DragDropManager
