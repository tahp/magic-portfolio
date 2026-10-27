import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import contentData from "./content.json";
import { IANATimeZone } from "@/types/content.types";
import { IconName } from "@/resources/icons";

const person: Person = {
  ...contentData.person,
  location: contentData.person.location as IANATimeZone,
};

const newsletter: Newsletter = {
  ...contentData.newsletter,
  title: contentData.newsletter.title as any,
  description: contentData.newsletter.description as any,
};

const social: Social = contentData.social as Social;

const home: Home = {
  ...contentData.home,
  headline: contentData.home.headline as any,
  featured: {
    ...contentData.home.featured,
    title: contentData.home.featured.title as any,
  },
  subline: contentData.home.subline as any,
};

const about: About = {
  ...contentData.about,
  intro: {
    ...contentData.about.intro,
    description: contentData.about.intro.description as any,
  },
  work: {
    ...contentData.about.work,
    experiences: contentData.about.work.experiences.map(exp => ({
      ...exp,
      achievements: exp.achievements.map(a => a as any)
    })),
  },
  studies: {
    ...contentData.about.studies,
    institutions: contentData.about.studies.institutions.map(inst => ({
      ...inst,
      description: inst.description as any
    })),
  },
  technical: {
    ...contentData.about.technical,
    skills: contentData.about.technical.skills.map(skill => ({
      ...skill,
      description: skill.description as any,
      tags: skill.tags?.map(tag => ({
        ...tag,
        icon: tag.icon as IconName
      }))
    })),
  },
};

const blog: Blog = contentData.blog as Blog;

const work: Work = contentData.work as Work;

const gallery: Gallery = contentData.gallery as Gallery;

export { person, social, newsletter, home, about, blog, work, gallery };
