const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

class AcknowledgementService {
    constructor() {
        // CDN image URL for all acknowledgement messages
        this.imageURL = 'https://cdn.discordapp.com/attachments/1438520973300338871/1448547405271142481/Gemini_Generated_Image_ws15xkws15xkws15.png?ex=693ba866&is=693a56e6&hm=9af2ef7bc5c8a2fc72f1b83920a7fccaae3c70d384b5a9faa50ac9c1fc6a6c6e&';
        // Unban acknowledgement channel ID - Logs channel
        this.UNBAN_ACK_CHANNEL = '1378464794499092581';
    }

    /**
     * TEXT DISPLAY BUILDER - Minimal text format with dark separator lines
     */
    buildTextDisplay(executor, text) {
        return `**Time:** <t:${Math.floor(Date.now() / 1000)}:T>\n**Executed by:** <@${executor.id}>\n${text}`;
    }

    /**
     * ACTION ROW BUILDER - Minimal buttons
     */
    buildActionRow(hasReason = false, customId = null) {
        const row = new ActionRowBuilder();
        
        if (hasReason) {
            const reasonButton = new ButtonBuilder()
                .setCustomId(`reason_${customId || Date.now()}`)
                .setLabel('Reason Details')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📝');
            
            row.addComponents(reasonButton);
        }

        return row.components.length > 0 ? row : null;
    }

    /**
     * SEPARATOR BUILDER - Creates pure Components V2 separators
     * Dark charcoal color #36454F - rounded rectangular thick bold line
     * Uses thick Unicode block characters for visual separator effect
     */
    buildSeparator(type = 'default') {
        return '';
    }

    /**
     * Creates a Components V2 SeparatorBuilder for pure component separators
     */
    createV2Separator(spacing = 'large') {
        return new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(spacing === 'large' ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);
    }

    /**
     * Creates a Components V2 container with separator for messages
     * Uses dark charcoal accent color #36454F
     */
    createV2Container(content) {
        const container = new ContainerBuilder()
            .setAccentColor(0x000000);
        
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content)
        );
        
        container.addSeparatorComponents(this.createV2Separator('large'));
        
        return container;
    }

    /**
     * Sends a message using Components V2 with proper separator
     */
    async sendV2Message(interaction, content, options = {}) {
        try {
            const container = new ContainerBuilder()
                .setAccentColor(0x000000);
            
            const separator = this.createV2Separator('large');
            
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Time:** <t:${Math.floor(Date.now() / 1000)}:T>`)
            );
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Executed by:** <@${interaction.user.id}>`)
            );
            container.addSeparatorComponents(separator);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(content)
            );
            
            const messageData = {
                components: [container],
                flags: MessageFlags.IsComponentsV2
            };
            
            if (options.ephemeral) {
                messageData.flags |= MessageFlags.Ephemeral;
            }
            
            if (interaction.replied || interaction.deferred) {
                return await interaction.editReply(messageData);
            }
            return await interaction.reply(messageData);
        } catch (error) {
            console.error('V2 message failed, falling back to embed:', error.message);
            return await this.send(interaction, content, options);
        }
    }

    /**
     * Create minimal acknowledgement embed with small white separator
     */
    createMinimalAcknowledgement(executor, text, hasReason = false, customId = null) {
        const embed = new EmbedBuilder()
            .setColor('#000000') // Dark charcoal color
            .setDescription(this.buildTextDisplay(executor, text))
            .setThumbnail(this.imageURL)
            .setTimestamp();

        const components = [];
        const actionRow = this.buildActionRow(hasReason, customId);
        if (actionRow) {
            components.push(actionRow);
        }

        return {
            embeds: [embed],
            components: components
        };
    }

    /**
     * Create reason modal
     */
    createReasonModal(customId, existingReason = '') {
        const modal = new ModalBuilder()
            .setCustomId(`reason_modal_${customId}`)
            .setTitle('Reason Details');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason_input')
            .setLabel('Enter or modify the reason')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Provide reason here...')
            .setValue(existingReason)
            .setMaxLength(1000)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);

        return modal;
    }

    /**
     * Send acknowledgement using Components V2 separators with embed fallback
     */
    async send(messageOrInteraction, text, options = {}) {
        const {
            ephemeral = false,
            hasReason = false,
            customId = null,
            followUp = false,
            useV2 = true
        } = options;

        const executor = messageOrInteraction.author || messageOrInteraction.user;
        
        // Try Components V2 first if supported
        if (useV2 && messageOrInteraction.isCommand?.()) {
            try {
                const container = new ContainerBuilder()
                    .setAccentColor(0x000000);
                
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Time:** <t:${Math.floor(Date.now() / 1000)}:T>\n**Executed by:** <@${executor.id}>`)
                );
                container.addSeparatorComponents(this.createV2Separator('large'));
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(text)
                );
                
                const v2Data = {
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                };
                
                if (ephemeral) {
                    v2Data.flags |= MessageFlags.Ephemeral;
                }
                
                if (messageOrInteraction.replied || messageOrInteraction.deferred) {
                    return await messageOrInteraction.editReply(v2Data);
                }
                return await messageOrInteraction.reply(v2Data);
            } catch (v2Error) {
                console.log('V2 components not supported, falling back to embed');
            }
        }
        
        // Fallback to embed without separator
        const customText = `**Time:** <t:${Math.floor(Date.now() / 1000)}:T>\n**Executed by:** <@${executor.id}>\n${text}`;
        
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setDescription(customText)
            .setThumbnail(this.imageURL)
            .setTimestamp();

        const messageData = { embeds: [embed] };

        if (ephemeral) {
            messageData.ephemeral = true;
        }

        // Add buttons if needed
        if (hasReason) {
            const row = new ActionRowBuilder();
            const reasonButton = new ButtonBuilder()
                .setCustomId(`reason_${customId || Date.now()}`)
                .setLabel('Reason Details')
                .setStyle(ButtonStyle.Secondary);
            
            row.addComponents(reasonButton);
            messageData.components = [row];
        }

        try {
            if (messageOrInteraction.isCommand?.() || messageOrInteraction.isContextMenu?.()) {
                if (followUp) {
                    return await messageOrInteraction.followUp(messageData);
                }
                if (messageOrInteraction.replied || messageOrInteraction.deferred) {
                    return await messageOrInteraction.editReply(messageData);
                }
                return await messageOrInteraction.reply(messageData);
            }
            
            if (messageOrInteraction.isMessageComponent?.() || messageOrInteraction.isModalSubmit?.()) {
                if (messageOrInteraction.replied || messageOrInteraction.deferred) {
                    return await messageOrInteraction.editReply(messageData);
                }
                return await messageOrInteraction.reply(messageData);
            }

            if (messageOrInteraction.author && messageOrInteraction.channel) {
                return await messageOrInteraction.channel.send(messageData);
            }

        } catch (error) {
            console.error('Error in acknowledgement service send:', error.message);
        }
    }

    /**
     * Send unban acknowledgement with small white separator
     */
    async sendUnbanAcknowledgement(guild, user, executor, reason = 'No reason provided') {
        try {
            const unbanChannel = guild.channels.cache.get(this.UNBAN_ACK_CHANNEL);
            if (!unbanChannel) {
                console.error('Unban acknowledgement channel not found');
                return null;
            }

            const text = `User <@${user.id}> (${user.tag}) has been unbanned\n**Reason:** ${reason}`;
            
            const embed = new EmbedBuilder()
                .setColor('#000000')
                .setDescription(`**Time:** <t:${Math.floor(Date.now() / 1000)}:T>\n**Executed by:** <@${executor.id}>\n${text}`)
                .setThumbnail(this.imageURL)
                .setTimestamp();

            // Add reason button for unban
            const row = new ActionRowBuilder();
            const reasonButton = new ButtonBuilder()
                .setCustomId(`reason_unban_${user.id}_${Date.now()}`)
                .setLabel('Edit Reason')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📝');

            const profileButton = new ButtonBuilder()
                .setURL(`https://discord.com/users/${user.id}`)
                .setLabel('View Profile')
                .setStyle(ButtonStyle.Link)
                .setEmoji('👤');

            row.addComponents(reasonButton, profileButton);

            return await unbanChannel.send({ 
                embeds: [embed],
                components: [row] 
            });

        } catch (error) {
            console.error('Error sending unban acknowledgement:', error.message);
            return null;
        }
    }

    /**
     * Update reason in existing acknowledgement
     */
    async updateReason(interaction, reason) {
        try {
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            const currentDescription = embed.data.description;
            
            const lines = currentDescription.split('\n');
            const reasonIndex = lines.findIndex(line => line.startsWith('**Reason:**'));
            
            if (reasonIndex !== -1) {
                lines[reasonIndex] = `**Reason:** ${reason}`;
            } else {
                const actionIndex = lines.findIndex(line => line.includes('has been'));
                if (actionIndex !== -1) {
                    lines.splice(actionIndex + 1, 0, `**Reason:** ${reason}`);
                } else {
                    lines.push(`**Reason:** ${reason}`);
                }
            }
            
            embed.setDescription(lines.join('\n'));
            
            await interaction.message.edit({ 
                embeds: [embed],
                components: interaction.message.components
            });
            
            return true;
        } catch (error) {
            console.error('Error updating reason:', error);
            return false;
        }
    }

    /**
     * Send with custom separator type
     */
    async sendWithCustomSeparator(messageOrInteraction, text, separatorType = 'white', options = {}) {
        return this.send(messageOrInteraction, text, {
            ...options,
            separatorType: separatorType
        });
    }

    /**
     * Handle interactions
     */
    async handleInteraction(interaction) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const customId = interaction.customId;
        
        // Handle reason button
        if (customId.startsWith('reason_') && !customId.startsWith('reason_modal_')) {
            const originalMessage = interaction.message;
            const embed = originalMessage.embeds[0];
            let existingReason = 'No reason provided';
            
            if (embed && embed.description) {
                const reasonMatch = embed.description.match(/\*\*Reason:\*\*\s*(.+)/);
                if (reasonMatch) {
                    existingReason = reasonMatch[1];
                }
            }
            
            const modal = this.createReasonModal(customId.replace('reason_', ''), existingReason);
            await interaction.showModal(modal);
        }
        
        // Handle modal submission
        else if (customId.startsWith('reason_modal_')) {
            const reason = interaction.fields.getTextInputValue('reason_input');
            
            const success = await this.updateReason(interaction, reason);
            
            if (success) {
                await interaction.reply({
                    content: '✅ Reason updated!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Failed to update reason.',
                    ephemeral: true
                });
            }
        }
    }
}

module.exports = AcknowledgementService;
