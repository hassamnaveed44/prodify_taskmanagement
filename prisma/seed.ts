import db from "../lib/db";
import bcryptjs from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean up existing data to allow safe re-runs
  // Order of deletion matters due to foreign key constraints!
  await db.chatMessage.deleteMany({});
  await db.chatSession.deleteMany({});
  await db.message.deleteMany({});
  await db.teamMember.deleteMany({});
  await db.team.deleteMany({});
  await db.goal.deleteMany({});
  await db.taskComment.deleteMany({});
  await db.task.deleteMany({});
  await db.projectMember.deleteMany({});
  await db.project.deleteMany({});
  await db.workspaceMember.deleteMany({});
  await db.workspace.deleteMany({});
  await db.refreshToken.deleteMany({});
  await db.user.deleteMany({});

  console.log("🧹 Cleaned up existing database tables.");

  // 2. Hash password for all users
  const hashedPassword = bcryptjs.hashSync("password123", 10);

  // 3. Create Users
  const userHassam = await db.user.create({
    data: {
      email: "hassam@prodify.com",
      password: hashedPassword,
      name: "Hassam Naveed",
    },
  });

  const userCourtney = await db.user.create({
    data: {
      email: "courtney@prodify.com",
      password: hashedPassword,
      name: "Courtney Henry",
    },
  });

  const userDevin = await db.user.create({
    data: {
      email: "devin@prodify.com",
      password: hashedPassword,
      name: "Devin Allen",
    },
  });

  const userJohn = await db.user.create({
    data: {
      email: "john@prodify.com",
      password: hashedPassword,
      name: "John Doe",
    },
  });

  const userSarah = await db.user.create({
    data: {
      email: "sarah@prodify.com",
      password: hashedPassword,
      name: "Sarah Lee",
    },
  });

  const userKate = await db.user.create({
    data: {
      email: "kate@prodify.com",
      password: hashedPassword,
      name: "Kate Taylor",
    },
  });

  console.log("👤 Created 6 users.");

  // 4. Create Workspace
  const workspace = await db.workspace.create({
    data: {
      name: "Hassam's Workspace",
      slug: "hassam-workspace",
      ownerId: userHassam.id,
    },
  });

  console.log("🏢 Created workspace.");

  // 5. Create Workspace Memberships
  const memberHassam = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userHassam.id,
      role: "OWNER",
    },
  });

  const memberCourtney = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userCourtney.id,
      role: "ADMIN",
    },
  });

  const memberDevin = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userDevin.id,
      role: "MEMBER",
    },
  });

  const memberJohn = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userJohn.id,
      role: "MEMBER",
    },
  });

  const memberSarah = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userSarah.id,
      role: "MEMBER",
    },
  });

  const memberKate = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userKate.id,
      role: "MEMBER",
    },
  });

  console.log("💼 Assigned roles to workspace members.");

  // 6. Create Projects
  const projectLaunch = await db.project.create({
    data: {
      name: "Product launch",
      slug: "product-launch",
      workspaceId: workspace.id,
    },
  });

  const projectBrainstorm = await db.project.create({
    data: {
      name: "Team brainstorm",
      slug: "team-brainstorm",
      workspaceId: workspace.id,
    },
  });

  const projectBranding = await db.project.create({
    data: {
      name: "Branding launch",
      slug: "branding-launch",
      workspaceId: workspace.id,
    },
  });

  console.log("📁 Created 3 projects.");

  // 7. Add Project Memberships
  const projectMembers = [
    memberHassam.id,
    memberCourtney.id,
    memberDevin.id,
    memberJohn.id,
    memberSarah.id,
    memberKate.id,
  ];

  for (const proj of [projectLaunch, projectBrainstorm, projectBranding]) {
    for (const memId of projectMembers) {
      await db.projectMember.create({
        data: {
          projectId: proj.id,
          memberId: memId,
        },
      });
    }
  }

  console.log("🔗 Connected project memberships.");

  // 8. Create Tasks matching Phase 1 UI Mockups
  // Project: Product Launch Tasks
  await db.task.create({
    data: {
      name: "Ensure all product features are fully developed and tested.",
      projectId: projectLaunch.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(),
      assigneeId: memberCourtney.id,
    },
  });

  await db.task.create({
    data: {
      name: "Confirm that the product meets all quality standards.",
      projectId: projectLaunch.id,
      status: "IN_PROGRESS",
      priority: "LOW",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days left
      assigneeId: memberDevin.id,
    },
  });

  await db.task.create({
    data: {
      name: "Conduct Final Quality Assurance (QA) Testing.",
      projectId: projectLaunch.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assigneeId: memberJohn.id,
    },
  });

  await db.task.create({
    data: {
      name: "Finalize deployment script and keys.",
      projectId: projectLaunch.id,
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      assigneeId: memberSarah.id,
    },
  });

  await db.task.create({
    data: {
      name: "Create user manuals, installation guides, and troubleshooting documents.",
      projectId: projectLaunch.id,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assigneeId: memberDevin.id,
    },
  });

  await db.task.create({
    data: {
      name: "Ensure all documentation is reviewed and approved.",
      projectId: projectLaunch.id,
      status: "TODO",
      priority: "LOW",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      assigneeId: memberKate.id,
    },
  });

  // Project: Team Brainstorm Tasks
  await db.task.create({
    data: {
      name: "Review code comments & PR feedback.",
      projectId: projectBrainstorm.id,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assigneeId: memberDevin.id,
    },
  });

  await db.task.create({
    data: {
      name: "Outline functional API specifications for Gemini integration.",
      projectId: projectBrainstorm.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(),
      assigneeId: memberHassam.id,
    },
  });

  // Project: Branding Launch Tasks
  await db.task.create({
    data: {
      name: "Export final vector assets for logos.",
      projectId: projectBranding.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assigneeId: memberSarah.id,
    },
  });

  console.log("📝 Seeded tasks for projects.");

  // 9. Create Project Goals
  await db.goal.create({
    data: {
      title: "Check Emails and Messages",
      percentage: 73,
      projectId: projectLaunch.id,
    },
  });

  await db.goal.create({
    data: {
      title: "Prepare a brief status update to the client",
      percentage: 11,
      projectId: projectLaunch.id,
    },
  });

  await db.goal.create({
    data: {
      title: "Update project documentation",
      percentage: 63,
      projectId: projectBrainstorm.id,
    },
  });

  console.log("🎯 Seeded goals.");

  // 10. Create Chat Channel and messages
  const teamGeneral = await db.team.create({
    data: {
      name: "General Chat",
      workspaceId: workspace.id,
    },
  });

  // Join all members to team General
  for (const memId of projectMembers) {
    await db.teamMember.create({
      data: {
        teamId: teamGeneral.id,
        memberId: memId,
      },
    });
  }

  await db.message.create({
    data: {
      teamId: teamGeneral.id,
      authorId: memberCourtney.id,
      content: "Hey, can you review the new branding mockups? I uploaded them to the workspace shared space.",
    },
  });

  await db.message.create({
    data: {
      teamId: teamGeneral.id,
      authorId: memberHassam.id,
      content: "Sure, I will take a look at it right away and leave my comments!",
    },
  });

  console.log("💬 Seeded team channels and messaging transcripts.");

  // 11. Seed AI Chatbot Session
  const chatSession = await db.chatSession.create({
    data: {
      title: "Workspace Assistance Query",
      userId: userHassam.id,
    },
  });

  await db.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      sender: "USER",
      content: "How many tasks are currently assigned to Courtney?",
    },
  });

  await db.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      sender: "AI",
      content: "Hi Hassam! Courtney currently has 1 task assigned in 'Product launch': 'Ensure all product features are fully developed and tested.' which is In Progress and due Today.",
    },
  });

  console.log("🤖 Seeded AI chatbot session transcripts.");
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  });
