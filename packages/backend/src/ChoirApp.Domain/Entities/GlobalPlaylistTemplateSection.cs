using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("GlobalPlaylistTemplateSections")]
    public class GlobalPlaylistTemplateSection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("global_template_section_id")]
        public Guid GlobalTemplateSectionId { get; private set; }

        [Required]
        [Column("title_key")]
        [MaxLength(100)]
        public string TitleKey { get; private set; }

        [Column("description_key")]
        [MaxLength(200)]
        public string? DescriptionKey { get; private set; }

        [Column("suggested_song_types")]
        [MaxLength(500)]
        public string? SuggestedSongTypes { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("global_template_id")]
        public Guid GlobalTemplateId { get; private set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; private set; }

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; private set; }

        [ForeignKey("GlobalTemplateId")]
        public GlobalPlaylistTemplate? GlobalTemplate { get; private set; }

        private GlobalPlaylistTemplateSection()
        {
            TitleKey = string.Empty;
        }

        private GlobalPlaylistTemplateSection(string titleKey, Guid globalTemplateId, int order, string? descriptionKey = null, string? suggestedSongTypes = null)
        {
            GlobalTemplateSectionId = Guid.NewGuid();
            TitleKey = titleKey;
            DescriptionKey = descriptionKey;
            SuggestedSongTypes = suggestedSongTypes;
            Order = order;
            GlobalTemplateId = globalTemplateId;
            CreatedAt = DateTimeOffset.UtcNow;
        }

        public static Result<GlobalPlaylistTemplateSection> Create(string titleKey, Guid globalTemplateId, int order, string? descriptionKey = null, string? suggestedSongTypes = null)
        {
            if (string.IsNullOrWhiteSpace(titleKey))
            {
                return Result.Fail("Section title key cannot be empty.");
            }

            if (globalTemplateId == Guid.Empty)
            {
                return Result.Fail("Global template ID cannot be empty.");
            }

            if (order < 0)
            {
                return Result.Fail("Section order cannot be negative.");
            }

            return Result.Ok(new GlobalPlaylistTemplateSection(titleKey, globalTemplateId, order, descriptionKey, suggestedSongTypes));
        }

        public Result UpdateOrder(int newOrder)
        {
            if (newOrder < 0)
            {
                return Result.Fail("Section order cannot be negative.");
            }

            Order = newOrder;
            UpdatedAt = DateTimeOffset.UtcNow;
            return Result.Ok();
        }

        public Result UpdateSection(string titleKey, string? descriptionKey = null, string? suggestedSongTypes = null)
        {
            if (string.IsNullOrWhiteSpace(titleKey))
            {
                return Result.Fail("Section title key cannot be empty.");
            }

            TitleKey = titleKey;
            DescriptionKey = descriptionKey;
            SuggestedSongTypes = suggestedSongTypes;
            UpdatedAt = DateTimeOffset.UtcNow;
            return Result.Ok();
        }
    }
}
