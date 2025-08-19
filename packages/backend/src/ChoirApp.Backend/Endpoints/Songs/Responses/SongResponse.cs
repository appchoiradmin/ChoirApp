using System;
using System.Collections.Generic;
using System.Linq;
using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs.Responses
{
    public class SongResponse
    {
        public Guid SongId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? AudioUrl { get; set; }
        public Guid CreatorId { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
        public int VersionNumber { get; set; }
        public Guid? BaseSongId { get; set; }
        public int Visibility { get; set; }
        public List<ChoirResponse> VisibleToChoirs { get; set; } = new List<ChoirResponse>();
        public List<TagResponse> Tags { get; set; } = new List<TagResponse>();

        public static SongResponse FromDto(SongDto dto)
        {
            // Use explicit casting to avoid ambiguity issues
            var songDto = (SongDto)dto;
            
            return new SongResponse
            {
                SongId = songDto.SongId,
                Title = songDto.Title,
                Artist = songDto.Artist,
                Content = songDto.Content,
                AudioUrl = songDto.AudioUrl,
                CreatorId = songDto.CreatorId,
                CreatorName = songDto.CreatorName,
                CreatedAt = songDto.CreatedAt,
                VersionNumber = songDto.VersionNumber,
                BaseSongId = songDto.BaseSongId,
                Visibility = (int)songDto.Visibility,
                VisibleToChoirs = songDto.VisibleToChoirs.Select(c => new ChoirResponse
                {
                    ChoirId = c.Id,
                    ChoirName = c.Name
                }).ToList(),
                Tags = songDto.Tags.Select(t => new TagResponse
                {
                    TagId = t.TagId,
                    TagName = t.TagName
                }).ToList()
            };
        }
    }

    public class ChoirResponse
    {
        public Guid ChoirId { get; set; }
        public string ChoirName { get; set; } = string.Empty;
    }

    public class TagResponse
    {
        public Guid TagId { get; set; }
        public string TagName { get; set; } = string.Empty;
    }
}
