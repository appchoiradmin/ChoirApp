using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

// Use alias to resolve ambiguity
using DomainEntities = ChoirApp.Domain.Entities;

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
                Title = p.Name,
                IsPublic = p.Visibility == DomainEntities.SongVisibilityType.PublicAll,
                ChoirId = p.ChoirId ?? Guid.Empty,
                Date = p.CreatedAt.DateTime,
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
                        SongId = ps.SongId,
                        Song = ps.Song == null ? null : new SongDto
                        {
                            SongId = ps.Song.SongId,
                            Title = ps.Song.Title,
                            Artist = ps.Song.Artist,
                            Content = ps.Song.Content,
                            CreatedAt = ps.Song.CreatedAt,
                            CreatorId = ps.Song.CreatorId,
                            CreatorName = ps.Song.Creator?.Name ?? string.Empty,
                            Visibility = (Application.Dtos.SongVisibilityType)ps.Song.Visibility,
                            Tags = ps.Song.Tags
                                .Where(t => t.Tag != null)
                                .Select(t => new TagDto
                                {
                                    TagId = t.Tag!.TagId,
                                    TagName = t.Tag!.TagName
                                }).ToList()
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
