// malo by byt 15 ale casova zona, takze 16
const reallyGreatDate = new Date(2026, 3, 11, 16, 0, 0)

function pluralize(value, forms) {
    // forms = [1, 2-4, 5+]
    if (value === 1) return forms[0]
    if (value >= 2 && value <= 4) return forms[1]
    return forms[2]
}

function countdown() {
    const element = document.getElementById('countdown')

    const now = new Date()
    const diff = reallyGreatDate - now

    if (diff <= 0) {
        document.getElementById('countdown-container').hidden = true
        return
    }

    const seconds = Math.floor(diff / 1000) % 60
    const minutes = Math.floor(diff / (1000 * 60)) % 60
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    element.textContent =
        `${days} ${pluralize(days, ['deň', 'dni', 'dní'])} ` +
        `${hours} ${pluralize(hours, ['hodina', 'hodiny', 'hodín'])} ` +
        `${minutes} ${pluralize(minutes, ['minúta', 'minúty', 'minút'])} ` +
        `${seconds} ${pluralize(seconds, ['sekunda', 'sekundy', 'sekúnd'])}`
}

// ----- Gift API integration -----

// Fetch gifts from the API and update the table buttons
async function fetchGiftsAndUpdate() {
    try {
        const resp = await fetch('/gifts', {cache: 'no-store'})
        if (!resp.ok) {
            console.error('GET /gifts failed', resp.status, resp.statusText)
            return
        }
        const gifts = await resp.json()
        updateGiftButtons(gifts)
    } catch (err) {
        console.error('Failed to fetch gifts', err)
    }
}

// Update buttons based on gifts data
function updateGiftButtons(gifts) {
    // map id -> reserved
    const reservedMap = {}
    for (const g of gifts) {
        reservedMap[Number(g.id)] = Boolean(g.reserved)
    }

    const rows = document.querySelectorAll('.section-gifts table tr')
    rows.forEach(row => {
        const idStr = row.id
        if (!idStr) return
        const id = Number(idStr)
        if (!Number.isFinite(id)) return
        const btn = row.querySelector('button')
        if (!btn) return

        btn.dataset.giftId = id
        if (reservedMap[id]) {
            btn.disabled = true
            btn.textContent = 'Vybraný'
            btn.classList.add('reserved')
        } else {
            btn.disabled = false
            btn.textContent = 'Vybrať dar'
            btn.classList.remove('reserved')
        }
    })
}

// Create confirmation modal in DOM (if not present)
function ensureConfirmModal() {
    if (document.getElementById('gift-confirm-modal')) return

    const modal = document.createElement('div')
    modal.id = 'gift-confirm-modal'
    modal.innerHTML = `
      <div class="overlay" tabindex="-1"></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gift-confirm-title">
        <h3 id="gift-confirm-title">Potvrdiť výber daru</h3>
        <p id="gift-confirm-text">Naozaj chcete vybrať tento dar?</p>
        <div class="buttons">
          <button class="cancel">Zrušiť</button>
          <button class="confirm">Potvrdiť</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Accessibility: close on overlay click or Escape
    modal.querySelector('.overlay').addEventListener('click', () => {
        modal.classList.remove('active')
    })
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active')
    })
}

// Show confirmation dialog, return Promise<boolean>
function showConfirmDialog(message) {
    ensureConfirmModal()
    const modal = document.getElementById('gift-confirm-modal')
    const titleEl = modal.querySelector('#gift-confirm-title')
    const textEl = modal.querySelector('#gift-confirm-text')
    const btnConfirm = modal.querySelector('button.confirm')
    const btnCancel = modal.querySelector('button.cancel')

    textEl.textContent = message || 'Naozaj chcete vybrať tento dar?'

    return new Promise((resolve) => {
        modal.classList.add('active')
        // focus management
        btnCancel.focus()

        function cleanup(result) {
            modal.classList.remove('active')
            btnConfirm.removeEventListener('click', onConfirm)
            btnCancel.removeEventListener('click', onCancel)
            modal.removeEventListener('keydown', onKey)
            resolve(result)
        }

        function onConfirm() {
            cleanup(true)
        }

        function onCancel() {
            cleanup(false)
        }

        function onKey(e) {
            if (e.key === 'Escape') cleanup(false)
        }

        btnConfirm.addEventListener('click', onConfirm)
        btnCancel.addEventListener('click', onCancel)
        modal.addEventListener('keydown', onKey)
    })
}

// Handler for Vybrať dar button clicks (uses event delegation)
async function onGiftsClick(ev) {
    const btn = ev.target.closest('button')
    if (!btn) return
    const tr = btn.closest('tr')
    if (!tr) return
    const idStr = btn.dataset.giftId ?? tr.id
    if (!idStr) return
    const id = Number(idStr)
    if (!Number.isFinite(id)) return

    if (btn.disabled) return

    const confirmed = await showConfirmDialog('Naozaj chcete vybrať tento dar?')
    if (!confirmed) return

    // Optimistic UI: disable button while request is ongoing
    btn.disabled = true
    const prevText = btn.textContent
    btn.textContent = 'Spracúvam...'

    try {
        const resp = await fetch(`/gifts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: '{}' // body not required by API but it's OK to send an empty JSON
        })

        if (!resp.ok) {
            // try to parse server error
            let errMsg = `${resp.status} ${resp.statusText}`
            try {
                const body = await resp.json()
                if (body && body.error) errMsg = body.error
            } catch (e) {
            }
            alert('Nepodarilo sa vybrať dar: ' + errMsg)
            btn.disabled = false
            btn.textContent = prevText
            return
        }

        // Success: mark as reserved
        btn.textContent = 'Vybraný'
        btn.classList.add('reserved')
        btn.disabled = true
    } catch (err) {
        console.error('PUT /gifts/' + id + ' failed', err)
        alert('Chyba pripojenia. Prosím skúste to znovu.')
        btn.disabled = false
        btn.textContent = prevText
    }
}

// ----- Initialization -----

addEventListener('DOMContentLoaded', () => {
    countdown()
    setInterval(countdown, 1000)

    // Attach click handler for Vybrať dar buttons
    const giftsSection = document.querySelector('.section-gifts')
    if (giftsSection) {
        giftsSection.addEventListener('click', onGiftsClick)
    }

    // Fetch current gifts state and update UI
    fetchGiftsAndUpdate()
})
