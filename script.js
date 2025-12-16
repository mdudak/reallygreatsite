const reallyGreatDate = new Date(2026, 3, 11, 15, 0, 0)

function countdown() {
    const element = document.getElementById('countdown')

    const now = new Date()
    const diff = reallyGreatDate - now

    if (diff <= 0) {
        return
    }

    const seconds = Math.floor(diff / 1000) % 60
    const minutes = Math.floor(diff / (1000 * 60)) % 60
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    element.textContent = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
}

addEventListener("DOMContentLoaded", (_event) => {
    countdown()
    setInterval(countdown, 1000)
})
