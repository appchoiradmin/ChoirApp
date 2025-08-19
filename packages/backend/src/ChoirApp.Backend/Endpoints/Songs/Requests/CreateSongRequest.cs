using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class CreateSongRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        public SongVisibilityType Visibility { get; set; } = SongVisibilityType.Private;
        [Url(ErrorMessage = "AudioUrl must be a valid URL")]
        public string? AudioUrl { get; set; }
        public List<Guid>? VisibleToChoirs { get; set; }
        public List<string>? Tags { get; set; }
    }
}
