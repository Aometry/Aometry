import { createCommand } from '@/builders/CommandBuilder'
import { MessageFlags, PermissionFlagsBits } from 'discord.js'

export default createCommand(
  'repo',
  'Manage external repositories and modules',
  (builder) => {
    builder
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((sub) =>
        sub
          .setName('install')
          .setDescription('Install a module from a repository')
          .addStringOption((opt) =>
            opt
              .setName('url')
              .setDescription('The git repository URL')
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName('branch')
              .setDescription('Branch to install from (default: repository default branch)')
              .setRequired(false)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('uninstall')
          .setDescription('Uninstall a module')
          .addStringOption((opt) =>
            opt
              .setName('name')
              .setDescription('The name of the module to uninstall')
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName('list').setDescription('List installed modules')
      )
      .addSubcommand((sub) =>
        sub
          .setName('sync-module')
          .setDescription('Sync an installed module to its configured remote')
          .addStringOption((opt) =>
            opt
              .setName('name')
              .setDescription('Installed module name')
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('configure-sync')
          .setDescription(
            'Configure remote sync settings for an installed module'
          )
          .addStringOption((opt) =>
            opt
              .setName('name')
              .setDescription('Installed module name')
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName('remote')
              .setDescription('Git HTTPS remote URL')
              .setRequired(false)
          )
          .addStringOption((opt) =>
            opt
              .setName('branch')
              .setDescription('Target branch name (default: main)')
              .setRequired(false)
          )
          .addStringOption((opt) =>
            opt
              .setName('token-env')
              .setDescription('Environment variable holding push token')
              .setRequired(false)
          )
      )
      .execute(async ({ interaction, client }) => {
        const subcommand = interaction.options.getSubcommand()
        const repoManager = client.repositoryManager

        if (subcommand === 'install') {
          const url = interaction.options.getString('url', true)
          const branch = interaction.options.getString('branch') || undefined
          await interaction.reply({
            content: `⏳ Cloning and installing from ${url}${branch ? ` (branch: ${branch})` : ''}...`,
            flags: MessageFlags.Ephemeral
          })

          const success = await repoManager.install(url, branch)

          if (success) {
            await interaction.editReply({
              content: `✅ Successfully installed module(s) from ${url}.`
            })
          } else {
            await interaction.editReply({
              content: `❌ Failed to install module from ${url}. Check console for details.`
            })
          }
        } else if (subcommand === 'uninstall') {
          const name = interaction.options.getString('name', true)
          await interaction.reply({
            content: `⏳ Uninstalling ${name}...`,
            flags: MessageFlags.Ephemeral
          })

          const success = await repoManager.uninstall(name)

          if (success) {
            await interaction.editReply({
              content: `✅ Successfully uninstalled ${name}.`
            })
          } else {
            await interaction.editReply({
              content: `❌ Failed to uninstall ${name}. Check console for details.`
            })
          }
        } else if (subcommand === 'list') {
          const modules = repoManager.getInstalledModules()
          if (modules.length === 0) {
            return interaction.reply({
              content: 'No modules installed.',
              flags: MessageFlags.Ephemeral
            })
          }

          const list = modules
            .map((m) => {
              const updateLabel = m.updateAvailable
                ? `update available${m.latestVersionSeen ? ` -> ${m.latestVersionSeen}` : ''}`
                : m.lastUpdateResult || 'up-to-date'
              const checkedAt = m.lastUpdateCheckAt
                ? `, checked ${new Date(m.lastUpdateCheckAt).toLocaleString()}`
                : ''
              return `- **${m.name}** (${m.version}) from ${m.repository} | ${updateLabel}${checkedAt}`
            })
            .join('\n')
          await interaction.reply({
            content: `**Installed Modules:**\n${list}`,
            flags: MessageFlags.Ephemeral
          })
        } else if (subcommand === 'sync-module') {
          const name = interaction.options.getString('name', true)
          await interaction.reply({
            content: `⏳ Syncing module ${name} to configured remote...`,
            flags: MessageFlags.Ephemeral
          })

          const syncResult = repoManager.syncModuleToRemote(name)
          if (!syncResult.success) {
            await interaction.editReply({
              content: `❌ ${syncResult.message}`
            })
            return
          }

          await interaction.editReply({
            content: `✅ ${syncResult.message}`
          })
        } else if (subcommand === 'configure-sync') {
          const name = interaction.options.getString('name', true)
          const remote = interaction.options.getString('remote')
          const branch = interaction.options.getString('branch')
          const tokenEnv = interaction.options.getString('token-env')

          const result = repoManager.configureModuleSync(name, {
            ...(remote ? { syncRemoteUrl: remote } : {}),
            ...(branch ? { syncBranch: branch } : {}),
            ...(tokenEnv ? { syncTokenEnvVar: tokenEnv } : {})
          })

          await interaction.reply({
            content: result.success
              ? `✅ ${result.message}`
              : `❌ ${result.message}`,
            flags: MessageFlags.Ephemeral
          })
        }
      })
  }
)
