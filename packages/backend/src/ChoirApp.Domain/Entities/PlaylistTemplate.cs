using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistTemplates")]
    public class PlaylistTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("template_id")]
        public Guid TemplateId { get; private set; }

        [Required]
        [Column("title")]
        public string Title { get; private set; }

        [Column("description")]
        public string? Description { get; private set; }

        [Required]
        [Column("choir_id")]
        public Guid ChoirId { get; private set; }

        [Column("is_default")]
        public bool IsDefault { get; private set; }

        [ForeignKey("ChoirId")]
        public Choir? Choir { get; private set; }

        public ICollection<PlaylistTemplateSection> Sections { get; private set; } = new List<PlaylistTemplateSection>();

        private PlaylistTemplate()
        {
            Title = string.Empty;
        }

        private PlaylistTemplate(string title, Guid choirId, string? description, bool isDefault = false)
        {
            TemplateId = Guid.NewGuid();
            Title = title;
            ChoirId = choirId;
            Description = description;
            IsDefault = isDefault;
        }

        public static Result<PlaylistTemplate> Create(string title, Guid choirId, string? description, bool isDefault = false)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return Result.Fail("Template title cannot be empty.");
            }

            if (choirId == Guid.Empty)
            {
                return Result.Fail("A template must be associated with a choir.");
            }

            var template = new PlaylistTemplate(title, choirId, description, isDefault);
            return Result.Ok(template);
        }

        public void UpdateTitle(string title)
        {
            if (!string.IsNullOrWhiteSpace(title))
            {
                Title = title;
            }
        }

        public void UpdateDescription(string? description)
        {
            Description = description;
        }

        public void SetDefault(bool isDefault)
        {
            IsDefault = isDefault;
        }
    }
}
