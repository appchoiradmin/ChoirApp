using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistSongs")]
    public class PlaylistSong
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("playlist_song_id")]
        public Guid PlaylistSongId { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("playlist_section_id")]
        public Guid PlaylistSectionId { get; private set; }

        [ForeignKey("PlaylistSectionId")]
        public PlaylistSection? PlaylistSection { get; private set; }

        [Column("master_song_id")]
        public Guid? MasterSongId { get; private set; }

        [ForeignKey("MasterSongId")]
        public MasterSong? MasterSong { get; private set; }

        [Column("choir_song_id")]
        public Guid? ChoirSongVersionId { get; private set; }

        [ForeignKey("ChoirSongVersionId")]
        public ChoirSongVersion? ChoirSongVersion { get; private set; }

        private PlaylistSong() { }

        private PlaylistSong(Guid playlistSectionId, int order, Guid? masterSongId, Guid? choirSongVersionId)
        {
            PlaylistSongId = Guid.NewGuid();
            PlaylistSectionId = playlistSectionId;
            Order = order;
            MasterSongId = masterSongId;
            ChoirSongVersionId = choirSongVersionId;
        }

        public static Result<PlaylistSong> Create(Guid playlistSectionId, int order, Guid? masterSongId, Guid? choirSongVersionId)
        {
            if (playlistSectionId == Guid.Empty)
                return Result.Fail("A playlist song must be associated with a section.");

            if (masterSongId == null && choirSongVersionId == null)
                return Result.Fail("A playlist song must have either a master song or a choir song version.");

            if (masterSongId != null && choirSongVersionId != null)
                return Result.Fail("A playlist song cannot have both a master song and a choir song version.");

            return Result.Ok(new PlaylistSong(playlistSectionId, order, masterSongId, choirSongVersionId));
        }
    }
}
