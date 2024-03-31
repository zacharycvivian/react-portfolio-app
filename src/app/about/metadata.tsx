import { useEffect } from "react";

interface MetaProps {
    title?: string;
    description?: string;
  }
  

  const Meta: React.FC<MetaProps> = ({ title, description }) => {
    useEffect(() => {
    if (title) {
      document.title = title;
    }

    let metaDescription = document.querySelector("meta[name='description']");
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.getElementsByTagName("head")[0].appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description || "");
  }, [title, description]);

  return null;
};

export default Meta;
