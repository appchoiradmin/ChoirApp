using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistTemplateSongs")]
    public class PlaylistTemplateSong
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("template_song_id")]
        public Guid TemplateSongId { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("template_section_id")]
        public Guid TemplateSectionId { get; private set; }

        [ForeignKey("TemplateSectionId")]
        public PlaylistTemplateSection? TemplateSection { get; private set; }

        [Column("master_song_id")]
        public Guid? MasterSongId { get; private set; }

        [ForeignKey("MasterSongId")]
        public MasterSong? MasterSong { get; private set; }

        [Column("choir_song_id")]
        public Guid? ChoirSongVersionId { get; private set; }

        [ForeignKey("ChoirSongVersionId")]
        public ChoirSongVersion? ChoirSongVersion { get; private set; }

        private PlaylistTemplateSong() { }

        private PlaylistTemplateSong(Guid templateSectionId, int order, Guid? masterSongId, Guid? choirSongVersionId)
        {
            TemplateSongId = Guid.NewGuid();
            TemplateSectionId = templateSectionId;
            Order = order;
            MasterSongId = masterSongId;
            ChoirSongVersionId = choirSongVersionId;
        }

        public static Result<PlaylistTemplateSong> Create(Guid templateSectionId, int order, Guid? masterSongId, Guid? choirSongVersionId)
        {
            if (templateSectionId == Guid.Empty)
                return Result.Fail("A playlist template song must be associated with a section.");

            if (masterSongId == null && choirSongVersionId == null)
                return Result.Fail("A playlist template song must have either a master song or a choir song version.");

            if (masterSongId != null && choirSongVersionId != null)
                return Result.Fail("A playlist template song cannot have both a master song and a choir song version.");

            return Result.Ok(new PlaylistTemplateSong(templateSectionId, order, masterSongId, choirSongVersionId));
        }
    }
}
