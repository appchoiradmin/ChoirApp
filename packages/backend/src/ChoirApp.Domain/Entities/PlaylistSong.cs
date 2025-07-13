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

        [Column("song_id")]
        public Guid SongId { get; private set; }

        [ForeignKey("SongId")]
        public Song? Song { get; private set; }

        private PlaylistSong() { }

        private PlaylistSong(Guid playlistSectionId, int order, Guid songId)
        {
            PlaylistSongId = Guid.NewGuid();
            PlaylistSectionId = playlistSectionId;
            Order = order;
            SongId = songId;
        }

        public static Result<PlaylistSong> Create(Guid playlistSectionId, int order, Guid songId)
        {
            if (playlistSectionId == Guid.Empty)
                return Result.Fail("A playlist song must be associated with a section.");
                
            if (songId == Guid.Empty)
                return Result.Fail("A playlist song must be associated with a song.");

            var playlistSong = new PlaylistSong(playlistSectionId, order, songId);
            return Result.Ok(playlistSong);
        }

        public void UpdateSection(Guid newPlaylistSectionId, int newOrder)
        {
            PlaylistSectionId = newPlaylistSectionId;
            Order = newOrder;
        }
    }
}
