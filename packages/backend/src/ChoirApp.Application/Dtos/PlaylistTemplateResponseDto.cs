namespace ChoirApp.Application.Dtos;

public class PlaylistTemplateResponseDto
{
    public List<UserPlaylistTemplateDto> UserTemplates { get; set; } = new();
    public List<GlobalPlaylistTemplateDto> GlobalTemplates { get; set; } = new();
}

public class UserPlaylistTemplateDto
{
    public Guid TemplateId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid ChoirId { get; set; }
    public bool IsDefault { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public List<UserPlaylistTemplateSectionDto> Sections { get; set; } = new();
}

public class UserPlaylistTemplateSectionDto
{
    public Guid SectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SuggestedSongTypes { get; set; }
    public int Order { get; set; }
    public Guid TemplateId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
