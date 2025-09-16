import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { GET_TAGS, CREATE_TAG, UPDATE_TAG, DELETE_TAG } from '../graphql/tags';

const Container = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: ${props => props.theme.spacing.sm};

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: ${props.theme.colors.primary};
          color: white;
          &:hover { background-color: #0056b3; }
        `;
      case 'danger':
        return `
          background-color: ${props.theme.colors.danger};
          color: white;
          &:hover { background-color: #c82333; }
        `;
      case 'secondary':
      default:
        return `
          background-color: ${props.theme.colors.light};
          color: ${props.theme.colors.text};
          border: 1px solid ${props.theme.colors.border};
          &:hover { background-color: #e2e6ea; }
        `;
    }
  }}
`;

const Form = styled.form`
  display: grid;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.md};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const TagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const TagCard = styled(Card)`
  position: relative;
`;

const TagHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TagColorBox = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  background-color: ${props => props.color};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-right: ${props => props.theme.spacing.sm};
`;

const TagTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
`;

const TagDescription = styled.p`
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_COLORS = [
  '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
  '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
];

export const Tags: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });

  const { data, loading, error, refetch } = useQuery(GET_TAGS);
  const [createTag] = useMutation(CREATE_TAG);
  const [updateTag] = useMutation(UPDATE_TAG);
  const [deleteTag] = useMutation(DELETE_TAG);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    });
    setEditingTag(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await updateTag({
          variables: {
            input: {
              id: editingTag.id,
              ...formData,
            },
          },
        });
      } else {
        await createTag({
          variables: { input: formData },
        });
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error('태그 저장 실패:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 태그를 삭제하시겠습니까?')) {
      try {
        await deleteTag({ variables: { id } });
        refetch();
      } catch (error) {
        console.error('태그 삭제 실패:', error);
      }
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error.message}</div>;

  return (
    <Container>
      <h2>태그 관리</h2>
      <p>보유 종목을 분류하기 위한 태그를 관리합니다.</p>
      
      <Button variant="primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '취소' : '태그 추가'}
      </Button>

      {showForm && (
        <Card>
          <h3>{editingTag ? '태그 수정' : '새 태그 추가'}</h3>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>태그 이름</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>설명</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label>색상</Label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DEFAULT_COLORS.map((color) => (
                  <div
                    key={color}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ marginTop: '8px', width: '80px', height: '40px' }}
              />
            </FormGroup>

            <div>
              <Button type="submit" variant="primary">
                {editingTag ? '수정' : '추가'}
              </Button>
              <Button type="button" onClick={resetForm}>취소</Button>
            </div>
          </Form>
        </Card>
      )}

      <TagGrid>
        {data?.tags?.map((tag: Tag) => (
          <TagCard key={tag.id}>
            <TagHeader>
              <TagColorBox color={tag.color} />
              <TagTitle>{tag.name}</TagTitle>
            </TagHeader>
            
            {tag.description && (
              <TagDescription>{tag.description}</TagDescription>
            )}

            <div>
              <Button onClick={() => handleEdit(tag)}>수정</Button>
              <Button variant="danger" onClick={() => handleDelete(tag.id)}>삭제</Button>
            </div>
          </TagCard>
        ))}
      </TagGrid>
    </Container>
  );
};