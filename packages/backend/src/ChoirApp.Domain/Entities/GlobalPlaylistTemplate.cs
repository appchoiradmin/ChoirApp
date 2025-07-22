using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("GlobalPlaylistTemplates")]
    public class GlobalPlaylistTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("global_template_id")]
        public Guid GlobalTemplateId { get; private set; }

        [Required]
        [Column("title_key")]
        [MaxLength(100)]
        public string TitleKey { get; private set; }

        [Column("description_key")]
        [MaxLength(200)]
        public string? DescriptionKey { get; private set; }

        [Required]
        [Column("category")]
        [MaxLength(50)]
        public string Category { get; private set; }

        [Required]
        [Column("display_order")]
        public int DisplayOrder { get; private set; }

        [Required]
        [Column("is_active")]
        public bool IsActive { get; private set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; private set; }

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; private set; }

        public ICollection<GlobalPlaylistTemplateSection> Sections { get; private set; } = new List<GlobalPlaylistTemplateSection>();

        private GlobalPlaylistTemplate()
        {
            TitleKey = string.Empty;
            Category = string.Empty;
        }

        private GlobalPlaylistTemplate(string titleKey, string category, string? descriptionKey = null, int displayOrder = 0, bool isActive = true)
        {
            GlobalTemplateId = Guid.NewGuid();
            TitleKey = titleKey;
            DescriptionKey = descriptionKey;
            Category = category;
            DisplayOrder = displayOrder;
            IsActive = isActive;
            CreatedAt = DateTimeOffset.UtcNow;
        }

        public static Result<GlobalPlaylistTemplate> Create(string titleKey, string category, string? descriptionKey = null, int displayOrder = 0, bool isActive = true)
        {
            if (string.IsNullOrWhiteSpace(titleKey))
            {
                return Result.Fail("Template title key cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(category))
            {
                return Result.Fail("Template category cannot be empty.");
            }

            return Result.Ok(new GlobalPlaylistTemplate(titleKey, category, descriptionKey, displayOrder, isActive));
        }

        public Result UpdateDisplayOrder(int newOrder)
        {
            if (newOrder < 0)
            {
                return Result.Fail("Display order cannot be negative.");
            }

            DisplayOrder = newOrder;
            UpdatedAt = DateTimeOffset.UtcNow;
            return Result.Ok();
        }

        public Result SetActive(bool isActive)
        {
            IsActive = isActive;
            UpdatedAt = DateTimeOffset.UtcNow;
            return Result.Ok();
        }

        public Result UpdateTemplate(string titleKey, string category, string? descriptionKey = null)
        {
            if (string.IsNullOrWhiteSpace(titleKey))
            {
                return Result.Fail("Template title key cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(category))
            {
                return Result.Fail("Template category cannot be empty.");
            }

            TitleKey = titleKey;
            Category = category;
            DescriptionKey = descriptionKey;
            UpdatedAt = DateTimeOffset.UtcNow;
            return Result.Ok();
        }
    }
}
