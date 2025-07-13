using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

// Use alias to resolve ambiguity
using DomainEntities = ChoirApp.Domain.Entities;

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
                Title = playlist.Name,
                IsPublic = playlist.Visibility == DomainEntities.SongVisibilityType.PublicAll,
                ChoirId = playlist.ChoirId ?? Guid.Empty,
                Date = playlist.CreatedAt.DateTime,
                PlaylistTemplateId = null, // This field doesn't exist in the new model
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
