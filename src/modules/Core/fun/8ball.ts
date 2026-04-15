import { createCommand } from '@/builders/CommandBuilder'
import { successEmbed } from '@/utils/responses'

const answers = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes - definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  "Don't count on it.",
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
]

export default createCommand(
  '8ball',
  'Ask the magic 8ball a question',
  (builder) => {
    builder
      .addStringOption('question', 'The question to ask', true)
      .execute(async ({ interaction }) => {
        const question = interaction.options.getString('question', true)
        const answer = answers[Math.floor(Math.random() * answers.length)]

        await interaction.reply({
          embeds: [
            successEmbed(
              '🎱 Magic 8Ball',
              `**Question:** ${question}\n**Answer:** ${answer}`
            )
          ]
        })
      })
  }
)
