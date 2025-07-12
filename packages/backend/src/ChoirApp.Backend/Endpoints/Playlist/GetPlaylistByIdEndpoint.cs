using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistByIdEndpoint : Endpoint<GetPlaylistByIdRequest, PlaylistDto>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistByIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Get("/playlists/{Id}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(GetPlaylistByIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistByIdAsync(req.Id);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var playlist = result.Value;
            var response = new PlaylistDto
            {
                Id = playlist.PlaylistId,
                Title = playlist.Title,
                IsPublic = playlist.IsPublic,
                ChoirId = playlist.ChoirId,
                PlaylistTemplateId = playlist.PlaylistTemplateId,
                Sections = playlist.Sections
                    .OrderBy(s => s.Order)
                    .Select(s => new PlaylistSectionDto
                {
                    Id = s.SectionId,
                    Title = s.Title,
                    Order = s.Order,
                    Songs = s.PlaylistSongs
                        .OrderBy(ps => ps.Order)
                        .Select(ps => new PlaylistSongDto
                    {
                        Id = ps.PlaylistSongId,
                        Order = ps.Order,
                        MasterSongId = ps.MasterSongId,
                        ChoirSongVersionId = ps.ChoirSongVersionId,
                        MasterSong = ps.MasterSong == null ? null : new MasterSongDto
                        {
                            SongId = ps.MasterSong.SongId,
                            Title = ps.MasterSong.Title,
                            Artist = ps.MasterSong.Artist,
                            LyricsChordPro = ps.MasterSong.LyricsChordPro,
                            Tags = ps.MasterSong.SongTags
                                .Where(st => st.Tag != null)
                                .Select(st => new TagDto
                                {
                                    TagId = st.Tag!.TagId,
                                    TagName = st.Tag!.TagName
                                }).ToList()
                        },
                        ChoirSongVersion = ps.ChoirSongVersion == null ? null : new ChoirSongVersionDto
                        {
                            ChoirSongId = ps.ChoirSongVersion.ChoirSongId,
                            MasterSongId = ps.ChoirSongVersion.MasterSongId,
                            ChoirId = ps.ChoirSongVersion.ChoirId,
                            EditedLyricsChordPro = ps.ChoirSongVersion.EditedLyricsChordPro,
                            LastEditedDate = ps.ChoirSongVersion.LastEditedDate,
                            EditorUserId = ps.ChoirSongVersion.EditorUserId
                        }
                    }).ToList()
                }).ToList(),
                Tags = playlist.PlaylistTags.Where(pt => pt.Tag != null).Select(pt => pt.Tag!.TagName).ToList()
            };

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistByIdRequest
    {
        public Guid Id { get; set; }
    }
}
