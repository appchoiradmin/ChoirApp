using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShareableChoirInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShareableChoirInvitations",
                columns: table => new
                {
                    invitation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invitation_token = table.Column<string>(type: "text", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: false),
                    date_created = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expiry_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    max_uses = table.Column<int>(type: "integer", nullable: true),
                    current_uses = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShareableChoirInvitations", x => x.invitation_id);
                    table.ForeignKey(
                        name: "FK_ShareableChoirInvitations_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShareableChoirInvitations_Users_created_by",
                        column: x => x.created_by,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShareableChoirInvitations_choir_id",
                table: "ShareableChoirInvitations",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_ShareableChoirInvitations_created_by",
                table: "ShareableChoirInvitations",
                column: "created_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShareableChoirInvitations");
        }
    }
}
