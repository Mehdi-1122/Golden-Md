// Bot jin groups mein hai un ki list
export default [
  { name: 'listgc', aliases: ['groups'], category: 'owner', owner: true, desc: 'Sab groups ki list',
    async run ({ sock, reply }) {
      const all = await sock.groupFetchAllParticipating()
      const list = Object.values(all)
      if (!list.length) return reply('Bot kisi group mein nahi.')
      let t = `👥 *${list.length} Groups:*\n\n`
      list.forEach((g, i) => { t += `${i + 1}. ${g.subject} (${g.participants.length})\n` })
      await reply(t.trim())
    } }
]
