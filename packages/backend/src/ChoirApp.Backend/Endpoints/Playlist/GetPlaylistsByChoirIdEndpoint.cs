using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistsByChoirIdEndpoint : Endpoint<GetPlaylistsByChoirIdRequest, IEnumerable<PlaylistDto>>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistsByChoirIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/choirs/{ChoirId}/playlists");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(GetPlaylistsByChoirIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistsByChoirIdAsync(req.ChoirId);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var playlists = result.Value;
            var response = playlists.Select(p => new PlaylistDto
            {
                Id = p.PlaylistId,
                Title = p.Title,
                IsPublic = p.IsPublic,
                ChoirId = p.ChoirId,
                Date = p.Date,
                Sections = p.Sections
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
                }).ToList()
            });

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistsByChoirIdRequest
    {
        public Guid ChoirId { get; set; }
    }
}
