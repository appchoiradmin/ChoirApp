using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistTemplateSections")]
    public class PlaylistTemplateSection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("template_section_id")]
        public Guid TemplateSectionId { get; private set; }

        [Required]
        [Column("title")]
        public string Title { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("template_id")]
        public Guid TemplateId { get; private set; }

        [ForeignKey("TemplateId")]
        public PlaylistTemplate? Template { get; private set; }

        private PlaylistTemplateSection()
        {
            Title = string.Empty;
        }

        private PlaylistTemplateSection(string title, Guid templateId, int order)
        {
            TemplateSectionId = Guid.NewGuid();
            Title = title;
            TemplateId = templateId;
            Order = order;
        }

        public static Result<PlaylistTemplateSection> Create(string title, Guid templateId, int order)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return Result.Fail("Section title cannot be empty.");
            }

            if (templateId == Guid.Empty)
            {
                return Result.Fail("A section must be associated with a template.");
            }

            var section = new PlaylistTemplateSection(title, templateId, order);
            return Result.Ok(section);
        }
    }
}
