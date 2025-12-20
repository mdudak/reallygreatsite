const reallyGreatDate = new Date(2026, 3, 11, 15, 0, 0)

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

addEventListener("DOMContentLoaded", () => {
    countdown()
    setInterval(countdown, 1000)
})
