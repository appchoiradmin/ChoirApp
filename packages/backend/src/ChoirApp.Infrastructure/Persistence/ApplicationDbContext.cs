using ChoirApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChoirApp.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Choir> Choirs { get; set; } = null!;
    public DbSet<MasterSong> MasterSongs { get; set; } = null!;
    public DbSet<ChoirSongVersion> ChoirSongVersions { get; set; } = null!;
    public DbSet<Playlist> Playlists { get; set; } = null!;
    public DbSet<PlaylistSection> PlaylistSections { get; set; } = null!;
    public DbSet<PlaylistSong> PlaylistSongs { get; set; } = null!;
    public DbSet<PlaylistTemplate> PlaylistTemplates { get; set; } = null!;
    public DbSet<PlaylistTemplateSection> PlaylistTemplateSections { get; set; } = null!;
    public DbSet<PlaylistTemplateSong> PlaylistTemplateSongs { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<SongTag> SongTags { get; set; } = null!;
    public DbSet<PlaylistTag> PlaylistTags { get; set; } = null!;
    public DbSet<UserChoir> UserChoirs { get; set; } = null!;
    public DbSet<ChoirInvitation> ChoirInvitations { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for SongTags
        modelBuilder.Entity<SongTag>()
            .HasKey(st => new { st.SongId, st.TagId });

        modelBuilder.Entity<SongTag>()
            .HasOne(st => st.MasterSong)
            .WithMany(s => s.SongTags)
            .HasForeignKey(st => st.SongId);

        modelBuilder.Entity<SongTag>()
            .HasOne(st => st.Tag)
            .WithMany(t => t.SongTags)
            .HasForeignKey(st => st.TagId);

        // Composite key for PlaylistTags
        modelBuilder.Entity<PlaylistTag>()
            .HasKey(pt => new { pt.PlaylistId, pt.TagId });

        modelBuilder.Entity<PlaylistTag>()
            .HasOne(pt => pt.Playlist)
            .WithMany(p => p.PlaylistTags)
            .HasForeignKey(pt => pt.PlaylistId);

        modelBuilder.Entity<PlaylistTag>()
            .HasOne(pt => pt.Tag)
            .WithMany(t => t.PlaylistTags)
            .HasForeignKey(pt => pt.TagId);

        // Composite key for UserChoirs
        modelBuilder.Entity<UserChoir>()
            .HasKey(uc => new { uc.UserId, uc.ChoirId });

        modelBuilder.Entity<UserChoir>()
            .HasOne(uc => uc.User)
            .WithMany(u => u.UserChoirs)
            .HasForeignKey(uc => uc.UserId);

        modelBuilder.Entity<UserChoir>()
            .HasOne(uc => uc.Choir)
            .WithMany(c => c.UserChoirs)
            .HasForeignKey(uc => uc.ChoirId);

        // Configure other relationships

        // User -> Choir (Admin)
        modelBuilder.Entity<Choir>()
            .HasOne(c => c.Admin)
            .WithMany(u => u.AdminOfChoirs)
            .HasForeignKey(c => c.AdminUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // User -> ChoirSongVersion (Editor)
        modelBuilder.Entity<ChoirSongVersion>()
            .HasOne(csv => csv.Editor)
            .WithMany(u => u.EditedSongs)
            .HasForeignKey(csv => csv.EditorUserId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.GoogleId)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        modelBuilder.Entity<Choir>()
            .HasIndex(c => c.ChoirName)
            .IsUnique();

        modelBuilder.Entity<ChoirSongVersion>()
            .HasIndex(csv => new { csv.MasterSongId, csv.ChoirId })
            .IsUnique();

        modelBuilder.Entity<Playlist>()
            .HasIndex(p => p.PlaylistId)
            .IsUnique();

        modelBuilder.Entity<PlaylistSection>()
            .HasIndex(ps => new { ps.PlaylistId, ps.Order })
            .IsUnique();
        
        modelBuilder.Entity<PlaylistSong>()
            .HasIndex(ps => new { ps.PlaylistSectionId, ps.Order })
            .IsUnique();

        modelBuilder.Entity<PlaylistTemplate>()
            .HasIndex(pt => new { pt.ChoirId, pt.Title })
            .IsUnique();
        
        modelBuilder.Entity<PlaylistTemplateSection>()
            .HasIndex(pts => new { pts.TemplateId, pts.Order })
            .IsUnique();

        modelBuilder.Entity<PlaylistTemplateSong>()
            .HasIndex(pts => new { pts.TemplateSectionId, pts.Order })
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.TagName)
            .IsUnique();

        modelBuilder.Entity<ChoirInvitation>()
            .HasIndex(ci => ci.InvitationToken)
            .IsUnique();
    }
}
