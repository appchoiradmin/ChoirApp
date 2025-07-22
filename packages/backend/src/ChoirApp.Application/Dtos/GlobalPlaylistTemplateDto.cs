namespace ChoirApp.Application.Dtos;

public class GlobalPlaylistTemplateDto
{
    public Guid GlobalTemplateId { get; set; }
    public string TitleKey { get; set; } = string.Empty;
    public string? DescriptionKey { get; set; }
    public string Category { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public List<GlobalPlaylistTemplateSectionDto> Sections { get; set; } = new();
}

public class GlobalPlaylistTemplateSectionDto
{
    public Guid GlobalTemplateSectionId { get; set; }
    public string TitleKey { get; set; } = string.Empty;
    public string? DescriptionKey { get; set; }
    public string? SuggestedSongTypes { get; set; }
    public int Order { get; set; }
    public Guid GlobalTemplateId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
